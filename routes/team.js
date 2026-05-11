const express = require("express");
const router = express.Router();

const {
  newTeam,
  getAllTeams,
  getTeam,
  getTeamsByLead,
  updateTeam,
  removeTeam,
} = require("../controllers/teamController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/team").post(newTeam);
router.route("/team").get(getAllTeams);
router.route("/user/team/:id").get(getTeamsByLead);
router.route("/team").put(updateTeam);
router.route("/team/:id").get(getTeam);
router.route("/team/:id").delete(removeTeam);

module.exports = router;
