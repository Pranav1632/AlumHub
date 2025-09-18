// utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or use SMTP config for your email service
    auth: {
      user: process.env.EMAIL_USER, // from your .env
      pass: process.env.EMAIL_PASS, // from your .env
    },
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
