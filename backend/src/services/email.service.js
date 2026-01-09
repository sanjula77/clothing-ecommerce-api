import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Create transporter (reusable connection)
let transporter = null;

/**
 * Initialize the email service transporter
 * This is called automatically when needed, but can be called explicitly
 */
export const initEmailService = async () => {
  // Return null if email is not configured (for development)
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS) {
    console.warn(
      "⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env"
    );
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: parseInt(env.EMAIL_PORT) || 587,
      secure: env.EMAIL_SECURE || false, // true for 465, false for other ports
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
      // Add timeout and connection pool settings
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
    });

    // Verify connection on creation
    transporter.verify((error) => {
      if (error) {
        console.error(
          "❌ Email transporter verification failed:",
          error.message
        );
      } else {
        console.log("✅ Email service ready");
      }
    });
  }

  return transporter;
};

/**
 * Send email asynchronously (fire and forget)
 * Email failures won't affect the main transaction
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @param {string} options.text - Plain text email content (optional)
 * @returns {Promise<void>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Initialize transporter if not already created
    if (!transporter) {
      await initEmailService();
    }

    if (!transporter) {
      console.warn(
        `⚠️  Email not sent to ${to} - Email service not configured`
      );
      return;
    }

    if (!to || !subject || !html) {
      console.error(
        "❌ Email send failed: Missing required fields (to, subject, html)"
      );
      return;
    }

    const mailOptions = {
      from: env.EMAIL_FROM || env.EMAIL_USER,
      to,
      subject,
      html,
      ...(text && { text }), // Include plain text if provided
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`, info.messageId);
  } catch (error) {
    // Log error but don't throw - email failure shouldn't break the flow
    console.error(`❌ Email send failed to ${to}:`, error.message);
    // In production, you might want to queue failed emails for retry
  }
};

/**
 * Close the email service transporter
 * This should be called in tests to ensure clean exit
 * @returns {Promise<void>}
 */
export const closeEmailService = async () => {
  if (transporter && transporter.close) {
    try {
      transporter.close();
      transporter = null;
    } catch (error) {
      // Ignore errors when closing
      console.warn("⚠️  Error closing email service:", error.message);
    }
  }
};
