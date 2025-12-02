const express = require("express");
const router = express.Router();


// Import student routes
const careerEvaluationsRoutes = require("./careerEvaluations.routes");
const studentExamsRoutes = require("./studentExams.routes");

// Mount routes
router.use("/career-evaluations", careerEvaluationsRoutes);
router.use("/student-exams", studentExamsRoutes);

const careersRoutes = require("./careers.routes");
const learningRoutes = require("./learning.routes");
const overviewRoutes = require("./overview.routes");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");
const checkStudent = require("../../../../middlewares/authentication/checkStudent");

router.use("/careers", checkAuth, checkStudent, careersRoutes);
router.use("/learning", checkAuth, checkStudent, learningRoutes);
router.use("/overview", checkAuth, checkStudent, overviewRoutes);


module.exports = router;
