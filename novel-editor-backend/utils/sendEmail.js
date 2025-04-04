// utils/sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  // --- IMPORTANT: Configure your email transport ---
  // This is an EXAMPLE using generic SMTP - replace with your service (SendGrid, Mailgun, Gmail OAuth etc.)
  // Store credentials securely in your .env file
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g., smtp.sendgrid.net, smtp.gmail.com
    port: process.env.EMAIL_PORT, // e.g., 587, 465
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports like 587
    auth: {
      user: process.env.EMAIL_USER, // Your email service username/API key
      pass: process.env.EMAIL_PASS, // Your email service password/API key
    },
    // Add TLS options if needed, e.g., for self-signed certs in dev
    // tls: {
    //   rejectUnauthorized: false // Use only for development/testing
    // }
  });

  // Define email options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Novel Scribe'}" <${process.env.EMAIL_FROM_ADDRESS}>`, // Sender address (must be authorized by your service)
    to: options.to, // Recipient email address
    subject: options.subject, // Subject line
    text: options.text, // Plain text body
    html: options.html, // HTML body (optional)
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    // Consider throwing error or handling it appropriately
    // throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;