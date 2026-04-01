const jwt = require("jsonwebtoken");
const User = require("../models/User");

const normalizeRole = (role) => (role === "collegeAdmin" ? "admin" : role);

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ msg: "User not found" });
      }
      req.user.role = normalizeRole(req.user.role);
      if (req.user.blocked) {
        return res.status(403).json({ msg: "Account is blocked by admin" });
      }

      next();
    } catch (err) {
      console.error("Auth error:", err.message);
      return res.status(401).json({ msg: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ msg: "Not authorized, no token" });
  }
};

// Role-based authorization
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const acceptedRoles = roles.map((role) => normalizeRole(role));
    const userRole = normalizeRole(req.user.role);
    if (!acceptedRoles.includes(userRole)) {
      return res.status(403).json({ msg: "Not authorized for this action" });
    }
    next();
  };
};
   
