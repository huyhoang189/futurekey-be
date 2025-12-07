const express = require("express");
const router = express.Router();
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

const questionsRoutes = require("./questions.routes");
const questionCategoriesRoutes = require("./questionCategories.routes");
const examConfigsRoutes = require("./examConfigs.routes");

router.use("/questions", checkAuth, questionsRoutes);
router.use("/question-categories", checkAuth, questionCategoriesRoutes);
router.use("/exam-configs", checkAuth, examConfigsRoutes);

module.exports = router;
