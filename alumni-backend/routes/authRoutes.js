const express = require("express");
const {
  signup,
  login,
  getAuthMe,
  getSampleCredentials,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/sample-credentials", getSampleCredentials);
router.get("/me", protect, getAuthMe);

module.exports = router;
