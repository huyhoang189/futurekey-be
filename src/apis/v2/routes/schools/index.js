const express = require("express");
const router = express.Router();

const careersRoutes = require("./careers.routes");
const classesRoutes = require("./classes.routes");
const schoolUsersRoutes = require("./schoolUsers.routes");
const studentsRoutes = require("./students.routes");
const careerEvaluationConfigRoutes = require("./careerEvaluationConfig.routes");
const statisticsRoutes = require("./statistics.routes");
const examsRoutes = require("./exams.routes");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");
const checkSchool = require("../../../../middlewares/authentication/checkSchool");

router.use("/careers", checkAuth, checkSchool, careersRoutes);
router.use("/classes", checkAuth, checkSchool, classesRoutes);
router.use("/school-users", checkAuth, checkSchool, schoolUsersRoutes);
router.use("/students", checkAuth, checkSchool, studentsRoutes);
router.use(
  "/career-evaluation-config",
  checkAuth,
  checkSchool,
  careerEvaluationConfigRoutes
);
router.use("/statistics", checkAuth, checkSchool, statisticsRoutes);
router.use("/exams", checkAuth, checkSchool, examsRoutes);

module.exports = router;
