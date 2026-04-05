const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    collegeId: { type: String, required: true, trim: true, index: true },
    prn: {
      type: String,
      trim: true,
      uppercase: true,
      required: function () {
        return this.role === "student" || this.role === "alumni";
      },
    },
    instituteCode: {
      type: String,
      trim: true,
      uppercase: true,
      required: function () {
        return this.role === "admin" || this.role === "collegeAdmin";
      },
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "collegeAdmin", "alumni", "student", "superAdmin"],
      default: "alumni",
    },
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: true },
    emailVerificationCodeHash: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    phoneVerificationCodeHash: { type: String, default: null },
    phoneVerificationExpires: { type: Date, default: null },
    blocked: { type: Boolean, default: false },
    communityChatBlocked: { type: Boolean, default: false },
    directChatBlocked: { type: Boolean, default: false },
    adminActionReason: { type: String, default: "" },
    lastLoginAt: { type: Date },
    lastProfileReminderSentAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ collegeId: 1, email: 1 }, { unique: true });
userSchema.index(
  { collegeId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string" } },
  }
);
userSchema.index(
  { collegeId: 1, prn: 1 },
  {
    unique: true,
    partialFilterExpression: { prn: { $type: "string" } },
  }
);
userSchema.index(
  { collegeId: 1, instituteCode: 1 },
  {
    unique: true,
    partialFilterExpression: { instituteCode: { $type: "string" } },
  }
);

module.exports = mongoose.model("User", userSchema);
