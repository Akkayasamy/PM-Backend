const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const {
  getClient,
  getClientAll,
  newClient,
  updateClient,
  removeClient,
} = require("../controllers/clientController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

// router.route("/Client").post(upload.single("file"), newClient);
router.route("/client").post(newClient);
router.route("/client").put(updateClient);
router.route("/client").get(getClientAll);
router.route("/client/:id").delete(removeClient);
router.route("/client/:id").get(getClient);

module.exports = router;
