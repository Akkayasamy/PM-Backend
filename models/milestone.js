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
    startDate: {
      type: String,
    },
    dueDate: {
      type: String,
    },
    completedDate: {
      type: String,
    },
    projectId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "planned",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Milestone || mongoose.model("Milestone", milestoneSchema);