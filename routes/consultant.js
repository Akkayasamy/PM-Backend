const express = require("express");
const router = express.Router();

const {
  newConsultant,
  getAllConsultants,
  getConsultant,
  getConsultantsByRole,
  updateConsultant,
  removeConsultant,
} = require("../controllers/consultantController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/consultant").post(newConsultant);
router.route("/consultant").get(getAllConsultants);
router.route("/user/consultant/:id").get(getConsultantsByRole);
router.route("/consultant").put(updateConsultant);
router.route("/consultant/:id").get(getConsultant);
router.route("/consultant/:id").delete(removeConsultant);

module.exports = router;
