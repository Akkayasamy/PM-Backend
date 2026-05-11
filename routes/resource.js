const express = require("express");
const router = express.Router();

const {
  newResource,
  getAllResources,
  getResource,
  updateResource,
  removeResource,
} = require("../controllers/resourceController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

// Routes
router.route("/resource").post(newResource); // Create
router.route("/resource").get(getAllResources); // Get all
router.route("/resource/:id").get(getResource); // Get one by ID
router.route("/resource/:id").delete(removeResource); // Delete by ID
router.route("/resource").put(updateResource); // Update by ID in body

module.exports = router;
