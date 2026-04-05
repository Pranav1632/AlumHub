const express = require("express");
const {
  signup,
  login,
  verifyEmailCode,
  resendEmailCode,
  getAuthMe,
  getSampleCredentials,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-email", verifyEmailCode);
router.post("/resend-email-code", resendEmailCode);
// router.post("/verify-phone", verifyPhoneCode);
// router.post("/resend-phone-code", resendPhoneCode);
router.post("/login", login);
router.get("/sample-credentials", getSampleCredentials);
router.get("/me", protect, getAuthMe);

module.exports = router;
