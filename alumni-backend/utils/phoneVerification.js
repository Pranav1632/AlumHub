const sendPhoneVerificationCode = async ({ phone, code }) => {
  if (!phone || !code) return;

  // Hook SMS provider here (Twilio/Fast2SMS/etc) when enabling phone verification.
  console.log(`[Phone Verification Stub] Send code ${code} to ${phone}`);
};

module.exports = {
  sendPhoneVerificationCode,
};
