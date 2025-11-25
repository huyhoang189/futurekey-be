const express = require("express");
const router = express.Router();

const careerCategoriesRoutes = require("./career-categories.routes");
const careersRoutes = require("./careers.routes");

router.use("/career-categories", careerCategoriesRoutes);
router.use("/careers", careersRoutes);

module.exports = router;
