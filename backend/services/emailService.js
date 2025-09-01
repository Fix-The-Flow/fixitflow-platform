const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (context) => ({
    subject: 'Welcome to FixItFlow - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">Welcome to FixItFlow!</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 10px 0;">Your troubleshooting companion</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">Hi ${context.firstName},</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining FixItFlow! We're excited to help you troubleshoot and fix everyday issues 
            with our comprehensive guides and AI-powered assistance.
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
            To get started, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${context.verificationUrl}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${context.verificationUrl}" style="color: #2563eb; word-break: break-all;">
              ${context.verificationUrl}
            </a>
          </p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Questions? Contact us at <a href="mailto:support@fixitflow.com" style="color: #2563eb;">support@fixitflow.com</a>
          </p>
        </div>
      </div>
    `
  }),

  'email-verification': (context) => ({
    subject: 'Verify Your Email - FixItFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Email Verification</h2>
        <p>Hi ${context.firstName},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${context.verificationUrl}" 
             style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  }),

  'password-reset': (context) => ({
    subject: 'Password Reset Request - FixItFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Password Reset Request</h2>
        <p>Hi ${context.firstName},</p>
        <p>You requested a password reset for your FixItFlow account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${context.resetUrl}" 
             style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in ${context.expiresIn}. If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  }),

  'phone-verification': (context) => ({
    subject: 'Phone Verification Code - FixItFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Phone Verification</h2>
        <p>Hi ${context.firstName},</p>
        <p>Your phone verification code for ${context.phone} is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
            ${context.verificationCode}
          </div>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code will expire in 10 minutes. If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  }),

  'subscription-confirmation': (context) => ({
    subject: 'Subscription Confirmed - FixItFlow Premium',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #059669;">Welcome to Premium!</h2>
        <p>Hi ${context.firstName},</p>
        <p>Your FixItFlow Premium subscription has been activated!</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">Subscription Details:</h3>
          <ul style="color: #374151;">
            <li>Plan: ${context.planName}</li>
            <li>Amount: $${context.amount}</li>
            <li>Next billing: ${context.nextBilling}</li>
          </ul>
        </div>
        
        <p>You now have access to premium features including:</p>
        <ul style="color: #374151;">
          <li>AI-powered troubleshooting chat</li>
          <li>Image upload for visual assistance</li>
          <li>Video chat support</li>
          <li>Premium troubleshooting guides</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
            Access Premium Features
          </a>
        </div>
      </div>
    `
  }),

  'admin-new-user': (context) => ({
    subject: 'New User Registration - FixItFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New User Registration</h2>
        <p>A new user has registered on FixItFlow:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Name:</strong> ${context.user.name}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${context.user.email}</li>
            <li style="margin-bottom: 10px;"><strong>Registered:</strong> ${context.user.registeredAt}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/admin/users" 
             style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
            View in Admin Panel
          </a>
        </div>
      </div>
    `
  }),

  'admin-new-subscription': (context) => ({
    subject: 'New Premium Subscription - FixItFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #059669;">New Premium Subscription</h2>
        <p>A user has subscribed to Premium:</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px;">
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>User:</strong> ${context.user.name}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${context.user.email}</li>
            <li style="margin-bottom: 10px;"><strong>Plan:</strong> ${context.subscription.planName}</li>
            <li style="margin-bottom: 10px;"><strong>Amount:</strong> $${context.subscription.amount}</li>
            <li style="margin-bottom: 10px;"><strong>Date:</strong> ${context.subscription.date}</li>
          </ul>
        </div>
      </div>
    `
  }),

  'payment-failed': (context) => ({
    subject: 'Payment Failed - FixItFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Payment Failed</h2>
        <p>Hi ${context.firstName},</p>
        <p>We were unable to process your payment for FixItFlow Premium subscription.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Payment Details:</h3>
          <p><strong>Amount:</strong> $${context.amount}</p>
          <p><strong>Status:</strong> Failed</p>
        </div>
        
        <p>To continue enjoying premium features, please update your payment method:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${context.retryUrl}" 
             style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
            Update Payment Method
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    // Get template if specified
    let subject = options.subject;
    let html = options.html;

    if (options.template && emailTemplates[options.template]) {
      const template = emailTemplates[options.template](options.context || {});
      subject = template.subject;
      html = template.html;
    }

    const mailOptions = {
      from: `"FixItFlow" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.email,
      subject,
      html,
      // Add plain text version if needed
      text: options.text || html.replace(/<[^>]*>/g, '')
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      to: options.email,
      subject,
      messageId: info.messageId
    });

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    logger.error('Email sending failed', {
      to: options.email,
      subject: options.subject,
      error: error.message,
      stack: error.stack
    });

    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Send bulk email function
const sendBulkEmail = async (emails, options) => {
  const results = [];

  for (const email of emails) {
    try {
      const result = await sendEmail({
        ...options,
        email
      });
      results.push({ email, success: true, messageId: result.messageId });
    } catch (error) {
      results.push({ email, success: false, error: error.message });
    }
  }

  return results;
};

// Send notification email to admin
const sendAdminNotification = async (type, data) => {
  if (!process.env.ADMIN_EMAIL) {
    logger.warn('Admin email not configured, skipping notification');
    return;
  }

  const templates = {
    'new-user': 'admin-new-user',
    'new-subscription': 'admin-new-subscription'
  };

  const template = templates[type];
  if (!template) {
    logger.warn(`Unknown admin notification type: ${type}`);
    return;
  }

  try {
    await sendEmail({
      email: process.env.ADMIN_EMAIL,
      template,
      context: data
    });
  } catch (error) {
    logger.error('Failed to send admin notification', { type, error: error.message });
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed', { error: error.message });
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  sendAdminNotification,
  verifyEmailConfig
};
