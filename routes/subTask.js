const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const {
  newSubTask,
  getAllSubTasks,
  getSubTask,
  getSubTasksByProject,
  updateSubTask,
  deleteSubTask,
  getSubTasksByUser,
  uploadAttachment,
  getSubTasksByParentTask,
  addComment,
} = require("../controllers/subTaskController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/subtask").post(newSubTask);
router.route("/subtask").get(getAllSubTasks);
router.route("/subtask/task/:id").get(getSubTasksByParentTask);
router.route("/subtask/user/:id").get(getSubTasksByUser);
router.route("/subtask").put(updateSubTask);
router.route("/subtask/:id").get(getSubTask);
router.route("/subtask/:id").delete(deleteSubTask);
router.route("/subtask/comment").post(addComment);

module.exports = router;
