const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updatePassword,
  logout,
  getUserDetails,
  updateUser,
  deleteUser,

  updateCustomer,
  users,
} = require("../controllers/authController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { authenticateToken } = require("./../middlewares/authToken");
const { getProjectReport, getUserPerformanceReport } = require('./../controllers/reportController');

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/customer/update").put(updateCustomer);
router.route("/logout").get(logout);
router.route("/me").get(getUserProfile);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);
router.route("/users").get(isAuthenticatedUser, users);

router.route("/user").put(updateUser);
router
  .route("/user/:id")
  .get(authorizeRoles("admin"), getUserDetails)
  .put(updateUser)
  .delete(deleteUser);

router.route("/user/:id").put(authenticateToken, updateUser);

router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, getUserDetails)
  .put(isAuthenticatedUser, updateUser)
  .delete(isAuthenticatedUser, deleteUser);

router.route("/report/project/:id").get(isAuthenticatedUser,getProjectReport);

// router.route("/report/user/:id").get(isAuthenticatedUser, getUserPerformanceReport);

module.exports = router;
