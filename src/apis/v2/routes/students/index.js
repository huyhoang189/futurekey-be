const express = require("express");
const router = express.Router();

const careersRoutes = require("./careers.routes");
const learningRoutes = require("./learning.routes");
const overviewRoutes = require("./overview.routes");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");
const checkStudent = require("../../../../middlewares/authentication/checkStudent");

router.use("/careers", checkAuth, checkStudent, careersRoutes);
router.use("/learning", checkAuth, checkStudent, learningRoutes);
router.use("/overview", checkAuth, checkStudent, overviewRoutes);

module.exports = router;
