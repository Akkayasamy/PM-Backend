const mongoose = require("mongoose");

const permissionsSchema = new mongoose.Schema({
  projects: {
    type: [String],
    enum: [
      "view_projects",
      "create_projects",
      "edit_projects",
      "delete_projects",
    ],
    default: [],
  },
  tasks: {
    type: [String],
    enum: [
      "view_tasks",
      "create_tasks",
      "edit_tasks",
      "delete_tasks",
      "assign_tasks",
      "update_task_status",
    ],
    default: [],
  },
  consultants: {
    type: [String],
    enum: [
      "view_consultants",
      "create_consultants",
      "edit_consultants",
      "delete_consultants",
    ],
    default: [],
  },
  clients: {
    type: [String],
    enum: ["view_clients", "create_clients", "edit_clients", "delete_clients"],
    default: [],
  },
  teams: {
    type: [String],
    enum: ["view_team_members", "create_teams", "edit_teams", "delete_teams"],
    default: [],
  },
  resources: {
    type: [String],
    enum: ["view_resources", "assign_resources"],
    default: [],
  },
  issues: {
    type: [String],
    enum: [
      "view_issues",
      "create_issues",
      "edit_issues",
      "resolve_issues",
      "update_issue_status",
    ],
    default: [],
  },
  milestones: {
    type: [String],
    enum: [
      "view_milestones",
      "create_milestones",
      "edit_milestones",
      "delete_milestones",
    ],
    default: [],
  },
});

const Permission = mongoose.model("Permission", permissionsSchema);

module.exports = Permission;
