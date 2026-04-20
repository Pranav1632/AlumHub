// utils/sendEmail.js
const nodemailer = require("nodemailer");

const MAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 8000);

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or use SMTP config for your email service
    auth: {
      user: process.env.EMAIL_USER, // from your .env
      pass: process.env.EMAIL_PASS, // from your .env
    },
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: MAIL_TIMEOUT_MS,
    socketTimeout: MAIL_TIMEOUT_MS,
  });

  const mailOptions = {
    from: `"AlumHub" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html, // optional
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
