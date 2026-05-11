const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  taskId: String,
  title: String,
  assignee: String,
  status: {
    type: String,
  },
  story_points: Number,
});

const SprintSchema = new mongoose.Schema({
  sprint_id: {
    type: String,
    unique: true,
  },
  name: String,
  goal: String,
  start_date: String,
  end_date: String,
  status: {
    type: String,
    enum: ["planned", "active", "completed"],
  },
  tasks: [TaskSchema],
});

module.exports = mongoose.model("Sprint", SprintSchema);
