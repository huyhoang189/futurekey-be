const express = require("express");
const router = express.Router();

const careerRoutes = require("./career.routes");
const careerCriteriaRoutes = require("./career-criteria.routes");
const careerOrderRoutes = require("./career-order.routes");
const careerOrderItemRoutes = require("./career-order-item.routes");
const careerSchoolLicenseRoutes = require("./career-school-license.routes");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

router.use("/careers", checkAuth, careerRoutes);
router.use("/career-criteria", checkAuth, careerCriteriaRoutes);
router.use("/career-orders", checkAuth, careerOrderRoutes);
router.use("/career-order-items", checkAuth, careerOrderItemRoutes);
router.use("/career-school-licenses", checkAuth, careerSchoolLicenseRoutes);

module.exports = router;
