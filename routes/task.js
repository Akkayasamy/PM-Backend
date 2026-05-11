const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const {
  newTask,
  getAllTasks,
  getTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  getTasksByUser,
  uploadAttachment,
  getDocument,
  addComment,
} = require("../controllers/taskController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router
  .route("/upload/attachment")
  .post(upload.single("file"), uploadAttachment);
router.route("/download/:file").get(getDocument);

router.route("/task").post(newTask);
router.route("/task").get(getAllTasks);
router.route("/task/project/:projectId").get(getTasksByProject);
router.route("/task/user/:id").get(getTasksByUser);
router.route("/task").put(updateTask);
router.route("/task/:id").get(getTask);
router.route("/task/:id").delete(deleteTask);
router.route("/task/comment").post(addComment);

module.exports = router;
