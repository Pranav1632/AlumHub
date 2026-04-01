const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sampleAuthUsers = require("../data/sampleAuthUsers.json");

const normalizeRole = (role) => (role === "collegeAdmin" ? "admin" : role);

const parseDuplicateKeyMessage = (err) => {
  if (!err || err.code !== 11000) return null;

  const keys = Object.keys(err.keyPattern || {});
  if (keys.includes("email")) return "Email already exists in this college";
  if (keys.includes("prn")) return "PRN already exists in this college";
  if (keys.includes("instituteCode")) return "Institute code already exists in this college";
  return "Duplicate value already exists";
};

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: normalizeRole(user.role),
      collegeId: user.collegeId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

const authPayload = (user) => ({
  token: signToken(user),
  id: user._id,
  role: normalizeRole(user.role),
  name: user.name,
  email: user.email,
  prn: user.prn,
  instituteCode: user.instituteCode,
  collegeId: user.collegeId,
  verified: user.verified,
});

const upsertSampleUser = async ({ name, email, password, role, collegeId, prn, instituteCode }) => {
  const normalizedCollegeId = String(collegeId || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPrn = prn ? String(prn).trim().toUpperCase() : undefined;
  const normalizedInstituteCode = instituteCode
    ? String(instituteCode).trim().toUpperCase()
    : undefined;

  let user = null;

  if (role === "alumni" && normalizedPrn) {
    user = await User.findOne({ collegeId: normalizedCollegeId, prn: normalizedPrn });
  }

  if (!user) {
    user = await User.findOne({ collegeId: normalizedCollegeId, email: normalizedEmail });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!user) {
    user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      collegeId: normalizedCollegeId,
      prn: normalizedPrn,
      instituteCode: normalizedInstituteCode,
      verified: true,
      blocked: false,
    });
  } else {
    user.name = name;
    user.email = normalizedEmail;
    user.password = hashedPassword;
    user.role = role;
    user.collegeId = normalizedCollegeId;
    user.prn = normalizedPrn;
    user.instituteCode = normalizedInstituteCode;
    user.verified = true;
    user.blocked = false;
    await user.save();
  }

  return user;
};

const trySampleAdminLogin = async ({ email, collegeId, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCollegeId = String(collegeId || "").trim();

  const sampleAdmin = (sampleAuthUsers.admins || []).find(
    (admin) =>
      admin.email.toLowerCase() === normalizedEmail &&
      admin.collegeId === normalizedCollegeId &&
      admin.password === password
  );

  if (!sampleAdmin) return null;

  return upsertSampleUser({ ...sampleAdmin, role: "admin" });
};

exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      prn,
      collegeId,
    } = req.body;

    if (!name || !email || !password || !role || !collegeId) {
      return res.status(400).json({ msg: "Name, email, password, role and collegeId are required" });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    const normalizedRole = normalizeRole(role);

    if (normalizedRole === "admin") {
      return res.status(403).json({
        msg: "Admin signup is disabled. Use admin login credentials from sample JSON.",
      });
    }

    if (![
      "student",
      "alumni",
    ].includes(normalizedRole)) {
      return res.status(400).json({ msg: "Invalid role for signup" });
    }

    if (!prn) {
      return res.status(400).json({ msg: "PRN is required for student/alumni" });
    }

    const existingEmail = await User.findOne({
      collegeId: collegeId.trim(),
      email: email.trim().toLowerCase(),
    });
    if (existingEmail) {
      return res.status(400).json({ msg: "Email already exists in this college" });
    }

    const existingPrn = await User.findOne({
      collegeId: collegeId.trim(),
      prn: prn.trim().toUpperCase(),
    });
    if (existingPrn) {
      return res.status(400).json({ msg: "PRN already exists in this college" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: normalizedRole,
      prn: prn.trim().toUpperCase(),
      collegeId: collegeId.trim(),
      verified: false,
    });

    return res.status(201).json({
      msg: "Signup successful. Wait for admin verification before login.",
      user: {
        id: user._id,
        name: user.name,
        role: normalizeRole(user.role),
        email: user.email,
        prn: user.prn,
        collegeId: user.collegeId,
        verified: user.verified,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    const duplicateMsg = parseDuplicateKeyMessage(err);
    if (duplicateMsg) {
      return res.status(409).json({ msg: duplicateMsg });
    }
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { portal, identifier, email, password, collegeId } = req.body;

    if (!password || !collegeId) {
      return res.status(400).json({ msg: "Password and collegeId are required" });
    }

    const requestedPortal = normalizeRole(portal || "");
    const query = { collegeId: collegeId.trim() };

    if (requestedPortal === "admin") {
      if (!email && !identifier) {
        return res.status(400).json({ msg: "Admin login requires email" });
      }

      const sampleAdminUser = await trySampleAdminLogin({
        email: email || identifier,
        collegeId,
        password,
      });

      if (sampleAdminUser) {
        sampleAdminUser.lastLoginAt = new Date();
        await sampleAdminUser.save();
        return res.json(authPayload(sampleAdminUser));
      }

      query.email = (email || identifier).trim().toLowerCase();
      query.role = { $in: ["admin", "collegeAdmin"] };
    } else if (requestedPortal === "student" || requestedPortal === "alumni") {
      if (!identifier) {
        return res.status(400).json({ msg: "PRN is required for student/alumni login" });
      }

      query.prn = identifier.trim().toUpperCase();
      query.role = requestedPortal;
    } else {
      return res.status(400).json({ msg: "Invalid portal type" });
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    if (user.blocked) {
      return res.status(403).json({ msg: "Account is blocked by admin" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const normalizedRole = normalizeRole(user.role);
    if (requestedPortal !== normalizedRole) {
      return res.status(403).json({ msg: "Wrong portal for this account" });
    }

    if (normalizedRole !== "admin" && !user.verified) {
      return res.status(403).json({ msg: "Account not verified yet by college admin" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return res.json(authPayload(user));
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getSampleCredentials = async (req, res) => {
  try {
    const sampleAdmins = (sampleAuthUsers.admins || []).map((admin) => ({
      name: admin.name,
      email: admin.email,
      password: admin.password,
      collegeId: admin.collegeId,
    }));

    return res.json({
      admins: sampleAdmins,
    });
  } catch (err) {
    console.error("Sample credential fetch error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAuthMe = async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      role: normalizeRole(req.user.role),
      name: req.user.name,
      email: req.user.email,
      prn: req.user.prn,
      collegeId: req.user.collegeId,
      verified: req.user.verified,
      blocked: req.user.blocked,
    },
  });
};
