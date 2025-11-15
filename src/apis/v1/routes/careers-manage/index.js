const express = require("express");
const router = express.Router();

const careerRoutes = require("./career.routes");
const careerCriteriaRoutes = require("./career-criteria.routes");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

router.use("/careers", checkAuth, careerRoutes);
router.use("/career-criteria", checkAuth, careerCriteriaRoutes);

module.exports = router;
