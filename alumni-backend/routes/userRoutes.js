const express = require('express');
const { getMe, updateMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get logged-in user's profile
router.get('/me', protect, getMe);

// Update profile
router.put('/update', protect, updateMe);

module.exports = router;
