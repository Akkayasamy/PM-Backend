const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    dueDate: {
      type: String,
    },
    projectId: {
      type: String,
    },
    status: {
      type: String,
      default: "planned",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Milestone", milestoneSchema);
