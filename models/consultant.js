const mongoose = require("mongoose");

const ConsultantSchema = new mongoose.Schema(
  {
    consultantId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
    mobile: {
      type: String,
    },
    ratePerHour: {
      type: Number,
    },
    designation: {
      type: String,
    },
    teamName: {
      type: String,
    },
    type: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Consultant", ConsultantSchema);
