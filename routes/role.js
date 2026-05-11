const express = require("express");
const router = express.Router();

const {
  newRole,
  getAllRoles,
  getRole,
  updateRole,
  removeRole,
} = require("../controllers/roleController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/role").post(newRole);
router.route("/role").get(getAllRoles);
router.route("/role/:id").get(getRole);
router.route("/role").put(updateRole);
router.route("/role/:id").delete(removeRole);

module.exports = router;
