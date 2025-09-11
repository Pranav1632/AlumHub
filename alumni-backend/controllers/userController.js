const User = require('../models/User');

// @desc    Get logged-in user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update logged-in user profile
// @route   PUT /api/users/update
// @access  Private
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow updating basic fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    // Role-specific fields
    if (user.role === 'student' || user.role === 'alumni') {
      user.course = req.body.course || user.course;
      user.batch = req.body.batch || user.batch;
      user.company = req.body.company || user.company;
      user.jobTitle = req.body.jobTitle || user.jobTitle;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getMe, updateMe };
