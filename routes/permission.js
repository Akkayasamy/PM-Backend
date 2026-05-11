const express = require("express");
const router = express.Router();

const {
  newPermission,
  getAllPermissions,
  getPermission,
  updatePermission,
  removePermission,
} = require("../controllers/permissionController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/permission").post(newPermission);
router.route("/permission").get(isAuthenticatedUser, getAllPermissions);
router.route("/permission/:id").get(isAuthenticatedUser, getPermission);
router.route("/permission").put(updatePermission);
router.route("/permission/:id").delete(removePermission);

module.exports = router;
