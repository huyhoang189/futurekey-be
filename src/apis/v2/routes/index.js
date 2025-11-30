const express = require("express");
const router = express.Router();

const publicRoutes = require("./public");
const schoolsRoutes = require("./schools");

router.use("/public", publicRoutes);
router.use("/schools", schoolsRoutes);

module.exports = router;
