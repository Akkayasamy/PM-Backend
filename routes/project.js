const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const {
  getProject,
  getProjectAll,
  newProject,
  updateProject,
  getProjectByUser,
  removeProject,
} = require("../controllers/projectController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

// router.route("/Project").post(upload.single("file"), newProject);
router.route("/project").post(newProject);
router.route("/project").get(getProjectAll);
router.route("/user/project/:id").get(getProjectByUser);
router.route("/project").put(updateProject);
router.route("/project/:id").get(getProject);
//router.route("/project").put(updateProjectById);
router.route("/project/:id").delete(removeProject);

module.exports = router;
