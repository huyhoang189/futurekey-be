const express = require("express");
const router = express.Router();

const careerRoutes = require("./career.routes");
const careerCriteriaRoutes = require("./career-criteria.routes");
const careerOrderRoutes = require("./career-order.routes");
const careerOrderItemRoutes = require("./career-order-item.routes");
const careerSchoolLicenseRoutes = require("./career-school-license.routes");

router.use("/careers", careerRoutes);
router.use("/career-criteria", careerCriteriaRoutes);
router.use("/career-orders", careerOrderRoutes);
router.use("/career-order-items", careerOrderItemRoutes);
router.use("/career-school-licenses", careerSchoolLicenseRoutes);

module.exports = router;
