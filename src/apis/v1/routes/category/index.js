const express = require("express");
const router = express.Router();

const careerCategoriesRoutes = require("./career-categories.routes");
const communesRoutes = require("./communes.routes");
const provincesRoutes = require("./provinces.routes");

router.use("/career-categories", careerCategoriesRoutes);
router.use("/communes", communesRoutes);
router.use("/provinces", provincesRoutes);

module.exports = router;
