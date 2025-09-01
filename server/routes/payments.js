const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Ebook, Purchase, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create payment intent for eBook purchase
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const { ebookId } = req.body;

    if (!ebookId) {
      return res.status(400).json({ message: 'eBook ID is required' });
    }

    const ebook = await Ebook.findById(ebookId).populate('category', 'name');
    if (!ebook || !ebook.isPublished) {
      return res.status(404).json({ message: 'eBook not found or not available' });
    }

    // Check if user already owns this eBook
    const existingPurchase = await Purchase.findOne({
      user: req.user._id,
      ebook: ebookId,
      status: 'completed'
    });

    if (existingPurchase) {
      return res.status(400).json({ message: 'You already own this eBook' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(ebook.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        ebookId: ebook._id.toString(),
        userId: req.user._id.toString(),
        ebookTitle: ebook.title
      }
    });

    // Create pending purchase record
    const purchase = new Purchase({
      user: req.user._id,
      ebook: ebookId,
      amount: ebook.price,
      stripePaymentId: paymentIntent.id,
      status: 'pending'
    });

    await purchase.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      ebook: {
        id: ebook._id,
        title: ebook.title,
        price: ebook.price,
        category: ebook.category.name
      }
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ message: 'Server error during payment setup' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Find and update purchase
        const purchase = await Purchase.findOne({
          stripePaymentId: paymentIntent.id
        }).populate('ebook').populate('user');

        if (purchase) {
          purchase.status = 'completed';
          await purchase.save();

          // Add eBook to user's purchased list
          const user = await User.findById(purchase.user._id);
          user.purchasedEbooks.push({
            ebook: purchase.ebook._id,
            purchaseDate: new Date(),
            transactionId: paymentIntent.id
          });
          await user.save();

          // Update eBook sales
          await Ebook.findByIdAndUpdate(purchase.ebook._id, {
            $inc: {
              'sales.count': 1,
              'sales.revenue': purchase.amount
            }
          });

          console.log('Payment successful for purchase:', purchase._id);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        await Purchase.findOneAndUpdate(
          { stripePaymentId: failedPayment.id },
          { status: 'failed' }
        );
        
        console.log('Payment failed for payment intent:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Get user's purchase history
router.get('/purchases', authenticate, async (req, res) => {
  try {
    const purchases = await Purchase.find({ 
      user: req.user._id,
      status: 'completed'
    })
    .populate('ebook', 'title slug coverImage price category')
    .populate('ebook.category', 'name')
    .sort({ createdAt: -1 });

    res.json({ purchases });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download purchased eBook
router.get('/download/:ebookId', authenticate, async (req, res) => {
  try {
    const { ebookId } = req.params;

    // Verify user owns this eBook
    const purchase = await Purchase.findOne({
      user: req.user._id,
      ebook: ebookId,
      status: 'completed'
    }).populate('ebook');

    if (!purchase) {
      return res.status(403).json({ 
        message: 'You do not have access to this eBook' 
      });
    }

    // Update download count
    purchase.downloadCount += 1;
    purchase.lastDownloaded = new Date();
    await purchase.save();

    // Return eBook content for download
    res.json({
      ebook: purchase.ebook,
      downloadInfo: {
        downloadCount: purchase.downloadCount,
        lastDownloaded: purchase.lastDownloaded
      }
    });
  } catch (error) {
    console.error('Download eBook error:', error);
    res.status(500).json({ message: 'Server error during download' });
  }
});

// Get Stripe publishable key
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

module.exports = router;
