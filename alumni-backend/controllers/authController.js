const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const AlumniProfile = require("../models/AlumniProfile");
const sampleAuthUsers = require("../data/sampleAuthUsers.json");
const sendEmail = require("../utils/sendEmail");
const { notifyUser } = require("../utils/notificationService");
const { getProfileCompletion } = require("../utils/profileCompletion");
const { createVerificationPayload, isCodeValid } = require("../utils/verificationCode");
const { sendPhoneVerificationCode } = require("../utils/phoneVerification");
const { EMAIL_VERIFICATION_ENABLED, PHONE_VERIFICATION_ENABLED } = require("../config/verificationFlags");

const PROFILE_REMINDER_INTERVAL_MS = 48 * 60 * 60 * 1000;
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 8000);

const normalizeRole = (role) => (role === "collegeAdmin" ? "admin" : role);

const withTimeout = async (promise, timeoutMs, timeoutMessage) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const parseDuplicateKeyMessage = (err) => {
  if (!err || err.code !== 11000) return null;

  const keys = Object.keys(err.keyPattern || {});
  if (keys.includes("email")) return "Email already exists in this college";
  if (keys.includes("prn")) return "PRN already exists in this college";
  if (keys.includes("instituteCode")) return "Institute code already exists in this college";
  if (keys.includes("phone")) return "Phone number already exists in this college";
  return "Duplicate value already exists";
};

const normalizeText = (value) => String(value || "").trim();

const isValidPdfUrl = (value) => {
  const text = normalizeText(value);
  if (!text) return false;

  let url;
  try {
    url = new URL(text);
  } catch {
    return false;
  }

  if (!["https:", "http:"].includes(url.protocol)) return false;

  const pathname = String(url.pathname || "").toLowerCase();
  return pathname.endsWith(".pdf");
};

const getSignupValidationError = ({ role, body }) => {
  const requiredCommonFields = ["name", "email", "phone", "password", "collegeId", "prn", "branch", "graduationYear", "location"];
  const missingCommon = requiredCommonFields.filter((field) => !normalizeText(body?.[field]));
  if (missingCommon.length > 0) {
    return "Name, email, phone, password, PRN, branch, graduation year, location and collegeId are required";
  }

  if (role === "student" && !normalizeText(body?.yearOfStudy)) {
    return "Year Of Study is required for student signup";
  }

  if (role === "alumni") {
    if (!normalizeText(body?.currentCompany) || !normalizeText(body?.jobTitle)) {
      return "Current company and job title are required for alumni signup";
    }
  }

  const resumeLink = normalizeText(body?.resumeLink);
  const lastYearFeeReceiptUrl = normalizeText(body?.lastYearFeeReceiptUrl);
  const recentFeeReceiptUrl = normalizeText(body?.recentFeeReceiptUrl);
  const studentIdCardUrl = normalizeText(body?.studentIdCardUrl);

  if (role === "alumni") {
    if (!resumeLink && !lastYearFeeReceiptUrl) {
      return "For alumni, upload at least one document: Resume PDF or Last Year Fee Receipt PDF";
    }
    if ((resumeLink && !isValidPdfUrl(resumeLink)) || (lastYearFeeReceiptUrl && !isValidPdfUrl(lastYearFeeReceiptUrl))) {
      return "Alumni documents must be valid PDF URLs";
    }
  }

  if (role === "student") {
    if (!recentFeeReceiptUrl && !studentIdCardUrl) {
      return "For students, upload at least one document: Recent Fee Receipt PDF or Student ID Card PDF";
    }
    if ((recentFeeReceiptUrl && !isValidPdfUrl(recentFeeReceiptUrl)) || (studentIdCardUrl && !isValidPdfUrl(studentIdCardUrl))) {
      return "Student documents must be valid PDF URLs";
    }
  }

  return null;
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
  phone: user.phone || "",
  prn: user.prn,
  instituteCode: user.instituteCode,
  collegeId: user.collegeId,
  verified: user.verified,
  emailVerified: user.emailVerified,
  phoneVerified: user.phoneVerified,
  blocked: user.blocked,
  communityChatBlocked: user.communityChatBlocked,
  directChatBlocked: user.directChatBlocked,
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
      emailVerified: true,
      phoneVerified: true,
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
    user.emailVerified = true;
    user.phoneVerified = true;
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

const buildProfileFromSignup = ({ role, collegeId, userId, phone, body }) => {
  const shared = {
    user: userId,
    collegeId,
    phone: normalizeText(phone),
    branch: normalizeText(body?.branch),
    graduationYear: normalizeText(body?.graduationYear),
    profileImage: "",
    bio: "",
    headline: "",
    location: normalizeText(body?.location),
    skills: [],
    interests: [],
    linkedIn: "",
    github: "",
    portfolio: "",
    resumeLink: normalizeText(body?.resumeLink),
  };

  if (role === "student") {
    return {
      ...shared,
      yearOfStudy: normalizeText(body?.yearOfStudy),
      achievements: [],
      recentFeeReceiptUrl: normalizeText(body?.recentFeeReceiptUrl),
      studentIdCardUrl: normalizeText(body?.studentIdCardUrl),
    };
  }

  return {
    ...shared,
    currentCompany: normalizeText(body?.currentCompany),
    jobTitle: normalizeText(body?.jobTitle),
    achievements: [],
    lastYearFeeReceiptUrl: normalizeText(body?.lastYearFeeReceiptUrl),
  };
};

const sendSignupVerificationEmails = async ({ user, emailCode }) => {
  if (!EMAIL_VERIFICATION_ENABLED || !emailCode) return;

  const subject = "AlumHub Email Verification Code";
  const text = `Hello ${user.name}, your AlumHub email verification code is ${emailCode}. It will expire in 10 minutes.`;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html: `<p>Hello ${user.name},</p><p>Your AlumHub email verification code is <b>${emailCode}</b>.</p><p>This code expires in 10 minutes.</p>`,
  });
};

const sendProfileCompletionReminderIfNeeded = async ({ req, user }) => {
  if (!["student", "alumni"].includes(user.role)) return;

  const Model = user.role === "student" ? StudentProfile : AlumniProfile;
  const profile = await Model.findOne({
    user: user._id,
    collegeId: user.collegeId,
  }).lean();

  const completion = getProfileCompletion({ user, profile });
  if (completion.isComplete) return;

  const now = Date.now();
  const lastReminderAt = user.lastProfileReminderSentAt ? new Date(user.lastProfileReminderSentAt).getTime() : 0;

  if (lastReminderAt && now - lastReminderAt < PROFILE_REMINDER_INTERVAL_MS) {
    return;
  }

  const io = req.app.get("io");
  const missingFieldsText = completion.missingFields.slice(0, 5).join(", ");

  await notifyUser({
    io,
    collegeId: user.collegeId,
    userId: user._id,
    type: "profile_reminder",
    title: "Complete Your Profile",
    message: `Please complete your profile. Missing: ${missingFieldsText}`,
    meta: {
      completionPercent: completion.completionPercent,
      missingFields: completion.missingFields,
    },
  });

  try {
    await sendEmail({
      to: user.email,
      subject: "AlumHub Profile Completion Reminder",
      text: `Hello ${user.name}, please complete your profile. Missing fields: ${completion.missingFields.join(", ")}.`,
      html: `<p>Hello ${user.name},</p><p>Please complete your profile to get better visibility and opportunities.</p><p>Missing fields: <b>${completion.missingFields.join(", ")}</b></p>`,
    });
  } catch (emailError) {
    console.error("Profile reminder email warning:", emailError.message);
  }

  user.lastProfileReminderSentAt = new Date();
  await user.save();
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
      phone,
    } = req.body;

    if (!name || !email || !password || !role || !collegeId || !phone) {
      return res.status(400).json({ msg: "Name, email, phone, password, role and collegeId are required" });
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

    if (!["student", "alumni"].includes(normalizedRole)) {
      return res.status(400).json({ msg: "Invalid role for signup" });
    }

    if (!prn) {
      return res.status(400).json({ msg: "PRN is required for student/alumni" });
    }

    const validationError = getSignupValidationError({ role: normalizedRole, body: req.body });
    if (validationError) {
      return res.status(400).json({ msg: validationError });
    }

    const normalizedCollegeId = normalizeText(collegeId);
    const normalizedEmail = normalizeText(email).toLowerCase();
    const normalizedPrn = normalizeText(prn).toUpperCase();
    const normalizedPhone = normalizeText(phone);

    const existingEmail = await User.findOne({
      collegeId: normalizedCollegeId,
      email: normalizedEmail,
    });
    if (existingEmail) return res.status(409).json({ msg: "Email already exists in this college" });

    const existingPrn = await User.findOne({
      collegeId: normalizedCollegeId,
      prn: normalizedPrn,
    });
    if (existingPrn) return res.status(409).json({ msg: "PRN already exists in this college" });

    const existingPhone = await User.findOne({
      collegeId: normalizedCollegeId,
      phone: normalizedPhone,
    });
    if (existingPhone) return res.status(409).json({ msg: "Phone number already exists in this college" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailVerification = EMAIL_VERIFICATION_ENABLED
      ? createVerificationPayload({ digits: 6, ttlMinutes: 10 })
      : null;

    const phoneVerification = PHONE_VERIFICATION_ENABLED
      ? createVerificationPayload({ digits: 6, ttlMinutes: 10 })
      : null;

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: normalizedRole,
      prn: normalizedPrn,
      collegeId: normalizedCollegeId,
      verified: false,
      emailVerified: !EMAIL_VERIFICATION_ENABLED,
      phoneVerified: !PHONE_VERIFICATION_ENABLED,
      emailVerificationCodeHash: emailVerification?.codeHash || null,
      emailVerificationExpires: emailVerification?.expiresAt || null,
      phoneVerificationCodeHash: phoneVerification?.codeHash || null,
      phoneVerificationExpires: phoneVerification?.expiresAt || null,
    });

    const signupProfileData = buildProfileFromSignup({
      role: normalizedRole,
      collegeId: normalizedCollegeId,
      userId: user._id,
      phone: normalizedPhone,
      body: req.body,
    });

    if (normalizedRole === "student") {
      await StudentProfile.findOneAndUpdate(
        { user: user._id, collegeId: normalizedCollegeId },
        { $set: signupProfileData },
        { upsert: true, new: true }
      );
    } else {
      await AlumniProfile.findOneAndUpdate(
        { user: user._id, collegeId: normalizedCollegeId },
        { $set: signupProfileData },
        { upsert: true, new: true }
      );
    }

    let emailDispatchWarning = "";

    try {
      await withTimeout(
        sendSignupVerificationEmails({
          user,
          emailCode: emailVerification?.code,
        }),
        EMAIL_SEND_TIMEOUT_MS,
        "Verification email dispatch timed out"
      );
    } catch (mailErr) {
      console.error("Signup verification email error:", mailErr.message);
      emailDispatchWarning = " Email verification mail could not be sent right now. Please use resend code.";
    }

    if (PHONE_VERIFICATION_ENABLED && phoneVerification?.code) {
      await sendPhoneVerificationCode({
        phone: normalizedPhone,
        code: phoneVerification.code,
      });
    }

    return res.status(201).json({
      msg: `Signup successful. Verify your email and wait for admin verification before login.${emailDispatchWarning}`,
      user: {
        id: user._id,
        name: user.name,
        role: normalizeRole(user.role),
        email: user.email,
        phone: user.phone,
        prn: user.prn,
        collegeId: user.collegeId,
        verified: user.verified,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    const duplicateMsg = parseDuplicateKeyMessage(err);
    if (duplicateMsg) return res.status(409).json({ msg: duplicateMsg });
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.verifyEmailCode = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const collegeId = String(req.body?.collegeId || "").trim();
    const code = String(req.body?.code || "").trim();

    if (!email || !collegeId || !code) {
      return res.status(400).json({ msg: "Email, collegeId and code are required" });
    }

    const user = await User.findOne({
      email,
      collegeId,
      role: { $in: ["student", "alumni"] },
    });

    if (!user) return res.status(404).json({ msg: "Account not found" });

    if (user.emailVerified) {
      return res.json({ success: true, msg: "Email already verified" });
    }

    const valid = isCodeValid({
      providedCode: code,
      storedHash: user.emailVerificationCodeHash,
      expiresAt: user.emailVerificationExpires,
    });

    if (!valid) {
      return res.status(400).json({ msg: "Invalid or expired verification code" });
    }

    user.emailVerified = true;
    user.emailVerificationCodeHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.json({
      success: true,
      msg: "Email verified successfully. Wait for admin approval to login.",
    });
  } catch (err) {
    console.error("Email verification error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.resendEmailCode = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const collegeId = String(req.body?.collegeId || "").trim();

    if (!email || !collegeId) {
      return res.status(400).json({ msg: "Email and collegeId are required" });
    }

    const user = await User.findOne({
      email,
      collegeId,
      role: { $in: ["student", "alumni"] },
    });

    if (!user) return res.status(404).json({ msg: "Account not found" });

    if (user.emailVerified) {
      return res.status(400).json({ msg: "Email is already verified" });
    }

    const nextCode = createVerificationPayload({ digits: 6, ttlMinutes: 10 });
    user.emailVerificationCodeHash = nextCode.codeHash;
    user.emailVerificationExpires = nextCode.expiresAt;
    await user.save();

    let resendWarning = "";
    try {
      await withTimeout(
        sendSignupVerificationEmails({
          user,
          emailCode: nextCode.code,
        }),
        EMAIL_SEND_TIMEOUT_MS,
        "Verification email resend timed out"
      );
    } catch (mailErr) {
      console.error("Resend verification email error:", mailErr.message);
      resendWarning = " Email could not be sent right now. Please retry in a few minutes.";
    }

    return res.json({
      success: true,
      msg: `Verification code generated.${resendWarning}`,
    });
  } catch (err) {
    console.error("Resend email code error:", err);
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

    if (normalizedRole !== "admin" && EMAIL_VERIFICATION_ENABLED && !user.emailVerified) {
      return res.status(403).json({ msg: "Please verify your email before login" });
    }

    if (normalizedRole !== "admin" && PHONE_VERIFICATION_ENABLED && !user.phoneVerified) {
      return res.status(403).json({ msg: "Please verify your phone before login" });
    }

    if (normalizedRole !== "admin" && !user.verified) {
      return res.status(403).json({ msg: "Account not verified yet by college admin" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    if (normalizedRole === "student" || normalizedRole === "alumni") {
      await sendProfileCompletionReminderIfNeeded({ req, user });
    }

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
      phone: req.user.phone || "",
      prn: req.user.prn,
      collegeId: req.user.collegeId,
      verified: req.user.verified,
      emailVerified: req.user.emailVerified,
      phoneVerified: req.user.phoneVerified,
      blocked: req.user.blocked,
      communityChatBlocked: req.user.communityChatBlocked,
      directChatBlocked: req.user.directChatBlocked,
    },
  });
};
