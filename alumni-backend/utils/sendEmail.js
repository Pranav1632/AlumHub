// utils/sendEmail.js
const nodemailer = require("nodemailer");

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const SMTP_HOST = String(process.env.SMTP_HOST || "smtp.gmail.com").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
const SMTP_SECURE = toBool(process.env.SMTP_SECURE, SMTP_PORT === 465);
const SMTP_REQUIRE_TLS = toBool(process.env.SMTP_REQUIRE_TLS, !SMTP_SECURE);
const SMTP_SERVICE = String(process.env.SMTP_SERVICE || "").trim();

const MAIL_CONNECTION_TIMEOUT_MS = Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || process.env.EMAIL_TIMEOUT_MS || 30000);
const MAIL_GREETING_TIMEOUT_MS = Number(process.env.EMAIL_GREETING_TIMEOUT_MS || process.env.EMAIL_TIMEOUT_MS || 30000);
const MAIL_SOCKET_TIMEOUT_MS = Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || process.env.EMAIL_TIMEOUT_MS || 30000);

let transporter;

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS are required for email delivery");
  }

  const baseConfig = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: MAIL_CONNECTION_TIMEOUT_MS,
    greetingTimeout: MAIL_GREETING_TIMEOUT_MS,
    socketTimeout: MAIL_SOCKET_TIMEOUT_MS,
  };

  if (SMTP_SERVICE) {
    return nodemailer.createTransport({
      ...baseConfig,
      service: SMTP_SERVICE,
    });
  }

  return nodemailer.createTransport({
    ...baseConfig,
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: SMTP_REQUIRE_TLS,
    family: 4,
  });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"AlumHub" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (error) {
    if (["ETIMEDOUT", "ECONNECTION", "ESOCKET"].includes(String(error?.code || ""))) {
      transporter = null;
    }
    throw error;
  }
};

module.exports = sendEmail;
