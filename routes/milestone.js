const express = require("express");
const router = express.Router();

const {
  newMilestone,
  getAllMilestones,
  getMilestone,
  updateMilestone,
  removeMilestone,
} = require("../controllers/milestoneController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/milestone").post(newMilestone);
router.route("/milestone").get(getAllMilestones);

router.route("/milestone/:id").get(getMilestone);
router.route("/milestone/:id").delete(removeMilestone);

router.route("/milestone").put(updateMilestone);

module.exports = router;
