const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    budget: {
      type: String,
    },
    budgetFunctionalHours: {
      type: String,
    },
    budgetTechnicalHours: {
      type: String,
    },
    startDate: {
      type: String,
    },
    endDate: {
      type: String,
    },

    actualDate: {
      type: String,
    },

    isBillable: {
      type: Boolean,
      default: false,
    },
    clientId: {
      type: String,
    },
    clientName: {
      type: String,
    },
    clientProjectManager: {
      type: String,
    },
    clientPMEmail: {
      type: String,
    },
    clientSPOC1: {
      type: String,
    },
    clientSPOC1Email: {
      type: String,
    },
    clientSPOC2: {
      type: String,
      default: "",
    },
    clientSPOC2Email: {
      type: String,
      default: "",
    },
    projectGroup: {
      type: String,
    },

    projectType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectType",
    },

    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "on_hold", "cancelled"],
      default: "not_started",
    },

    managerId: {
      type: String,
    },

    teamleadId: {
      type: String,
    },
  },
  { timestamps: true }
);

// Use conditional export to prevent model overwrite errors during hot-reloads
module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);