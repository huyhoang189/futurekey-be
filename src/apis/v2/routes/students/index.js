const express = require("express");
const router = express.Router();

// Import student routes
const careerEvaluationsRoutes = require("./careerEvaluations.routes");
const studentExamsRoutes = require("./studentExams.routes");

// Mount routes
router.use("/career-evaluations", careerEvaluationsRoutes);
router.use("/student-exams", studentExamsRoutes);

module.exports = router;
