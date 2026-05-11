const express = require("express");
const router = express.Router();

const {
  newSprint,
  getAllSprints,
  getSprint,
  getSprintBySprintId,
  updateSprint,
  removeSprint,
  addTaskInSprint,
} = require("../controllers/sprintController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/sprint").post(newSprint);
router.route("/sprint").get(getAllSprints);
router.route("/sprint/task").post(addTaskInSprint);
router.route("/sprint").put(updateSprint);

router.route("/sprint/:id").get(getSprint);

router.route("/sprint/by-id/:sprintId").get(getSprintBySprintId);

router.route("/sprint/:id").delete(removeSprint);

module.exports = router;
