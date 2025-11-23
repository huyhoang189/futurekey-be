const express = require("express");
const router = express.Router();

const careerRoutes = require("./career.routes");
const careerClassConfigRoutes = require("./careerClassConfig.routes");

// Routes cho career orders
router.use("/career-orders", careerRoutes);

// Routes cho careers
router.use("/careers", careerRoutes);

// Routes cho class criteria config
router.use("/class-criteria-config", careerClassConfigRoutes);

module.exports = router;
