const express = require('express');
const { getMe, updateMe, getStudentVisitProfile, getPublicProfile, globalSearch } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Get logged-in user's profile
router.get('/me', protect, getMe);
router.get('/global-search', protect, globalSearch);

// Update profile
router.put('/update', protect, updateMe);
router.get('/visit/student/:id', protect, authorizeRoles("student"), getStudentVisitProfile);
router.get('/public/:id', protect, getPublicProfile);

module.exports = router;
