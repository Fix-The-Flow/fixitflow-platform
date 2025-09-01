const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const User = require('../models/User');
const logger = require('../config/logger');
const { sendEmail, sendAdminNotification } = require('./emailService');

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox', // sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Subscription plan configurations
const SUBSCRIPTION_PLANS = {
  premium_monthly: {
    name: 'Premium Monthly',
    amount: 4.99,
    currency: 'usd',
    interval: 'month',
    features: [
      'AI-powered troubleshooting chat',
      'Image upload for visual help',
      'Video chat support',
      'Premium troubleshooting guides',
      'Priority support'
    ]
  },
  premium_yearly: {
    name: 'Premium Yearly',
    amount: 39.99,
    currency: 'usd',
    interval: 'year',
    features: [
      'AI-powered troubleshooting chat',
      'Image upload for visual help',
      'Video chat support',
      'Premium troubleshooting guides',
      'Priority support',
      'Save 33% compared to monthly'
    ]
  },
  premium_daily: {
    name: 'Premium Daily',
    amount: 1.99,
    currency: 'usd',
    interval: 'day',
    features: [
      'AI-powered troubleshooting chat',
      'Image upload for visual help',
      'Video chat support',
      'Premium troubleshooting guides'
    ]
  }
};

// Stripe Functions
class StripePaymentService {
  // Create a customer
  static async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: {
          userId: user._id.toString()
        }
      });

      logger.info('Stripe customer created', {
        customerId: customer.id,
        userId: user._id
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        userId: user._id,
        error: error.message
      });
      throw error;
    }
  }

  // Create a subscription
  static async createSubscription(customerId, priceId, userId) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId.toString()
        }
      });

      logger.info('Stripe subscription created', {
        subscriptionId: subscription.id,
        customerId,
        userId
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create Stripe subscription', {
        customerId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Create a one-time payment intent
  static async createPaymentIntent(amount, currency = 'usd', customerId, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: { enabled: true }
      });

      logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount,
        customerId
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create Stripe payment intent', {
        amount,
        customerId,
        error: error.message
      });
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId) {
    try {
      const deletedSubscription = await stripe.subscriptions.cancel(subscriptionId);
      
      logger.info('Stripe subscription cancelled', {
        subscriptionId
      });

      return deletedSubscription;
    } catch (error) {
      logger.error('Failed to cancel Stripe subscription', {
        subscriptionId,
        error: error.message
      });
      throw error;
    }
  }

  // Get subscription details
  static async getSubscription(subscriptionId) {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      logger.error('Failed to retrieve Stripe subscription', {
        subscriptionId,
        error: error.message
      });
      throw error;
    }
  }

  // Handle webhook events
  static async handleWebhook(body, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      logger.info('Stripe webhook received', {
        eventType: event.type,
        eventId: event.id
      });

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          logger.info('Unhandled Stripe webhook event', { eventType: event.type });
      }

      return { received: true };
    } catch (error) {
      logger.error('Stripe webhook error', {
        error: error.message
      });
      throw error;
    }
  }

  static async handleSubscriptionCreated(subscription) {
    try {
      const userId = subscription.metadata.userId;
      const user = await User.findById(userId);
      
      if (user) {
        await user.updateSubscription({
          plan: 'premium',
          status: 'active',
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer,
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000)
        });

        // Send confirmation email
        await sendEmail({
          email: user.email,
          template: 'subscription-confirmation',
          context: {
            firstName: user.firstName,
            planName: 'Premium',
            amount: subscription.items.data[0].price.unit_amount / 100,
            nextBilling: new Date(subscription.current_period_end * 1000).toLocaleDateString()
          }
        });

        // Send admin notification
        await sendAdminNotification('new-subscription', {
          user: {
            name: user.fullName,
            email: user.email
          },
          subscription: {
            planName: 'Premium',
            amount: subscription.items.data[0].price.unit_amount / 100,
            date: new Date().toLocaleString()
          }
        });
      }
    } catch (error) {
      logger.error('Error handling subscription created', {
        subscriptionId: subscription.id,
        error: error.message
      });
    }
  }

  static async handleSubscriptionUpdated(subscription) {
    try {
      const userId = subscription.metadata.userId;
      const user = await User.findById(userId);
      
      if (user) {
        const status = subscription.status === 'active' ? 'active' : 
                      subscription.status === 'canceled' ? 'cancelled' : 
                      subscription.status;

        await user.updateSubscription({
          status,
          endDate: new Date(subscription.current_period_end * 1000)
        });
      }
    } catch (error) {
      logger.error('Error handling subscription updated', {
        subscriptionId: subscription.id,
        error: error.message
      });
    }
  }

  static async handleSubscriptionDeleted(subscription) {
    try {
      const userId = subscription.metadata.userId;
      const user = await User.findById(userId);
      
      if (user) {
        await user.updateSubscription({
          plan: 'free',
          status: 'cancelled',
          endDate: new Date()
        });
      }
    } catch (error) {
      logger.error('Error handling subscription deleted', {
        subscriptionId: subscription.id,
        error: error.message
      });
    }
  }

  static async handlePaymentSucceeded(invoice) {
    try {
      logger.info('Payment succeeded', {
        invoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        customerId: invoice.customer
      });
    } catch (error) {
      logger.error('Error handling payment succeeded', {
        invoiceId: invoice.id,
        error: error.message
      });
    }
  }

  static async handlePaymentFailed(invoice) {
    try {
      const customerId = invoice.customer;
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.metadata.userId) {
        const user = await User.findById(customer.metadata.userId);
        if (user) {
          // Send payment failed notification
          await sendEmail({
            email: user.email,
            subject: 'Payment Failed - FixItFlow',
            template: 'payment-failed',
            context: {
              firstName: user.firstName,
              amount: invoice.amount_due / 100,
              retryUrl: `${process.env.FRONTEND_URL}/billing`
            }
          });
        }
      }

      logger.warn('Payment failed', {
        invoiceId: invoice.id,
        customerId,
        amount: invoice.amount_due / 100
      });
    } catch (error) {
      logger.error('Error handling payment failed', {
        invoiceId: invoice.id,
        error: error.message
      });
    }
  }
}

// PayPal Functions
class PayPalPaymentService {
  // Create a one-time payment
  static createPayment(amount, currency = 'USD', description = 'FixItFlow Premium') {
    return new Promise((resolve, reject) => {
      const paymentConfig = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        redirect_urls: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        },
        transactions: [{
          amount: {
            total: amount.toFixed(2),
            currency
          },
          description
        }]
      };

      paypal.payment.create(paymentConfig, (error, payment) => {
        if (error) {
          logger.error('PayPal payment creation failed', {
            error: error.message,
            amount,
            currency
          });
          reject(error);
        } else {
          logger.info('PayPal payment created', {
            paymentId: payment.id,
            amount,
            currency
          });
          resolve(payment);
        }
      });
    });
  }

  // Execute payment after approval
  static executePayment(paymentId, payerId) {
    return new Promise((resolve, reject) => {
      const executeConfig = {
        payer_id: payerId
      };

      paypal.payment.execute(paymentId, executeConfig, (error, payment) => {
        if (error) {
          logger.error('PayPal payment execution failed', {
            paymentId,
            payerId,
            error: error.message
          });
          reject(error);
        } else {
          logger.info('PayPal payment executed successfully', {
            paymentId,
            payerId,
            state: payment.state
          });
          resolve(payment);
        }
      });
    });
  }

  // Create billing agreement for subscriptions
  static createBillingAgreement(planId, description) {
    return new Promise((resolve, reject) => {
      const agreementConfig = {
        name: 'FixItFlow Premium Subscription',
        description,
        start_date: new Date(Date.now() + 60000).toISOString(), // Start 1 minute from now
        plan: {
          id: planId
        },
        payer: {
          payment_method: 'paypal'
        }
      };

      paypal.billingAgreement.create(agreementConfig, (error, agreement) => {
        if (error) {
          logger.error('PayPal billing agreement creation failed', {
            planId,
            error: error.message
          });
          reject(error);
        } else {
          logger.info('PayPal billing agreement created', {
            agreementId: agreement.id,
            planId
          });
          resolve(agreement);
        }
      });
    });
  }

  // Execute billing agreement
  static executeBillingAgreement(token) {
    return new Promise((resolve, reject) => {
      paypal.billingAgreement.execute(token, {}, (error, agreement) => {
        if (error) {
          logger.error('PayPal billing agreement execution failed', {
            token,
            error: error.message
          });
          reject(error);
        } else {
          logger.info('PayPal billing agreement executed', {
            agreementId: agreement.id,
            state: agreement.state
          });
          resolve(agreement);
        }
      });
    });
  }

  // Cancel billing agreement
  static cancelBillingAgreement(agreementId) {
    return new Promise((resolve, reject) => {
      const cancelConfig = {
        note: 'User requested cancellation'
      };

      paypal.billingAgreement.cancel(agreementId, cancelConfig, (error, result) => {
        if (error) {
          logger.error('PayPal billing agreement cancellation failed', {
            agreementId,
            error: error.message
          });
          reject(error);
        } else {
          logger.info('PayPal billing agreement cancelled', {
            agreementId
          });
          resolve(result);
        }
      });
    });
  }
}

// Main Payment Service
class PaymentService {
  static getSubscriptionPlans() {
    return SUBSCRIPTION_PLANS;
  }

  static async processSubscription(userId, planType, paymentMethod = 'stripe') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const plan = SUBSCRIPTION_PLANS[planType];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      if (paymentMethod === 'stripe') {
        // Ensure user has Stripe customer ID
        if (!user.subscription.stripeCustomerId) {
          const customer = await StripePaymentService.createCustomer(user);
          user.subscription.stripeCustomerId = customer.id;
          await user.save();
        }

        return {
          method: 'stripe',
          customerId: user.subscription.stripeCustomerId,
          plan
        };
      } else if (paymentMethod === 'paypal') {
        return {
          method: 'paypal',
          plan
        };
      }

      throw new Error('Unsupported payment method');
    } catch (error) {
      logger.error('Subscription processing failed', {
        userId,
        planType,
        paymentMethod,
        error: error.message
      });
      throw error;
    }
  }

  static async cancelSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.subscription.stripeSubscriptionId) {
        await StripePaymentService.cancelSubscription(user.subscription.stripeSubscriptionId);
      }

      if (user.subscription.paypalSubscriptionId) {
        await PayPalPaymentService.cancelBillingAgreement(user.subscription.paypalSubscriptionId);
      }

      await user.updateSubscription({
        plan: 'free',
        status: 'cancelled',
        endDate: new Date()
      });

      logger.info('Subscription cancelled successfully', {
        userId
      });

      return { success: true, message: 'Subscription cancelled successfully' };
    } catch (error) {
      logger.error('Subscription cancellation failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = {
  StripePaymentService,
  PayPalPaymentService,
  PaymentService,
  SUBSCRIPTION_PLANS
};
