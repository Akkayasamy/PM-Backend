const express = require("express");
const router = express.Router();

const {
  newIssue,
  getAllIssues,
  getIssue,
  updateIssue,
  removeIssue,
} = require("../controllers/issueController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/issue").post(newIssue); // Create
router.route("/issue").get(getAllIssues); // Read all
router.route("/issue/:id").get(getIssue); // Read one
router.route("/issue").put(updateIssue); // Update
router.route("/issue/:id").delete(removeIssue); // Delete

module.exports = router;
