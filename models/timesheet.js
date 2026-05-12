const mongoose = require("mongoose");

const timesheetSchema = new mongoose.Schema({
    timesheetId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone" }, // Added this
    taskId: { type: String, ref: "Task" }, // Linked by taskId string as per your task model
    subTaskId: { type: String, ref: "Subtask" },
    date: { type: Date, required: true },
    hours: { type: Number, required: true },
    description: { type: String, required: true },
    isBillable: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ["Draft", "Submitted", "Approved", "Rejected"],
        default: "Draft"
    }
}, { timestamps: true });

module.exports = mongoose.models.Timesheet || mongoose.model("Timesheet", timesheetSchema);