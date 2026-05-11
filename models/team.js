const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    leadId: {
      type: String,
    },
    deliveryManager: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    members: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Team", TeamSchema);
