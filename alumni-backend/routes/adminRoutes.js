// routes/adminRoutes.js
const express = require("express");
const User = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Verify a student or alumni by ID
 * Only collegeAdmin can do this (must send Bearer token)
 */
router.put(
  "/verify/:id",
  protect,
  authorizeRoles("collegeAdmin"),
  async (req, res) => {
    try {
      const target = await User.findById(req.params.id);
      if (!target) return res.status(404).json({ msg: "User not found" });

      // Only student/alumni can be verified by college admin
      if (!["student", "alumni"].includes(target.role)) {
        return res.status(400).json({ msg: `Cannot verify a '${target.role}' via this endpoint` });
      }

      if (target.verified) {
        return res.status(400).json({ msg: "User is already verified" });
      }

      target.verified = true;
      await target.save();

      res.json({
        msg: "User verified successfully",
        user: {
          _id: target._id,
          name: target.name,
          role: target.role,
          email: target.email,
          prn: target.prn,
          verified: target.verified,
        },
      });
    } catch (err) {
      console.error("Verify user error:", err);
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

/**
 * List pending (unverified) students/alumni
 * GET /api/admin/pending?role=student|alumni (optional filter)
 */
router.get(
  "/pending",
  protect,
  authorizeRoles("collegeAdmin"),
  async (req, res) => {
    try {
      const { role } = req.query;
      const roleFilter =
        role && ["student", "alumni"].includes(role)
          ? role
          : { $in: ["student", "alumni"] };

      const users = await User.find({
        role: roleFilter,
        verified: false,
      }).select("-password");

      res.json({ count: users.length, users });
    } catch (err) {
      console.error("Pending list error:", err);
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

module.exports = router;
