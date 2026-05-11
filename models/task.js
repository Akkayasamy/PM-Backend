const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskId: {
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
    status: {
      type: String,
      enum: ["Open", "WIP", "QC", "Under Review", "Closed", "Re Open", "Hold"],
      default: "Open",
    },
    taskType: {
      type: String,
    },
    taskNature: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    functionalConsultant: {
      type: String,
    },
    technicalConsultant: {
      type: String,
    },
    totalHours: {
      type: Number,
    },
    estimatedHours: {
      type: Number,
    },
    billable: {
      type: Boolean,
      default: false,
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
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      // required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
