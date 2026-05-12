const express = require("express");
const router = express.Router();

const {
    newTimesheet,
    getMyTimesheets,
    getAllTimesheets,
    getTimesheetDetails,
    updateTimesheet,
    deleteTimesheet,
    getTimesheetsByProject
} = require("../controllers/timesheetController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

// Standard CRUD
router.route("/timesheet").post(isAuthenticatedUser, newTimesheet);
router.route("/timesheet").get(isAuthenticatedUser, authorizeRoles("admin", "Manager"), getAllTimesheets);

// User-specific and Project-specific routes
router.route("/timesheet/user/:userId").get(isAuthenticatedUser, getMyTimesheets);
router.route("/timesheet/project/:projectId").get(isAuthenticatedUser, getTimesheetsByProject);

// Specific Timesheet ID operations
router.route("/timesheet/:id")
    .get(isAuthenticatedUser, getTimesheetDetails)
    .put(isAuthenticatedUser, updateTimesheet)
    .delete(isAuthenticatedUser, deleteTimesheet);

module.exports = router;