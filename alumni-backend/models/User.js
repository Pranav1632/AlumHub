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
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "collegeAdmin", "alumni", "student", "superAdmin"],
      default: "alumni",
    },
    verified: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ collegeId: 1, email: 1 }, { unique: true });
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
