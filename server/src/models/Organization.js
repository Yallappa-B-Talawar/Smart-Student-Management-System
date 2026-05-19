const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    // 5-letter uppercase code set by admin — used as a join code for teachers/students
    code: {
      type: String,
      required: [true, "Organization code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [5, "Code must be exactly 5 characters"],
      maxlength: [5, "Code must be exactly 5 characters"],
      match: [/^[A-Z0-9]{5}$/, "Code must be exactly 5 uppercase letters or digits"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

organizationSchema.index({ status: 1 });

const Organization = mongoose.model("Organization", organizationSchema);
module.exports = Organization;
