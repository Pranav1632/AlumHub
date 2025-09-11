// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    prn: {
      type: String,
      sparse: true,
      unique: true,
      required: function () {
        return this.role === "student" || this.role === "alumni";
      },
    },

    instituteCode: {
      type: String,
      sparse: true,
      unique: true,
      required: function () {
        return this.role === "collegeAdmin";
      },
    },

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["alumni", "student", "collegeAdmin"],
      default: "alumni",
    },

    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
