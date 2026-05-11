const mongoose = require("mongoose");

const subTaskSchema = new mongoose.Schema(
  {
    parentTaskId: {
      type: String,
      required: true,
    },
    parentSubTaskId: {
      type: String,
      default: null,
    },
    subTaskId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Open", "WIP", "QC", "Under Review", "Closed", "Re Open", "Hold"],
      default: "Open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    projectId: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
    },
    endDate: {
      type: String,
    },
    estimatedHours: {
      type: String,
    },
    attachments: {
      type: [String],
    },
    comments: [
      {
        text: String,
        createdBy: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubTask", subTaskSchema);
