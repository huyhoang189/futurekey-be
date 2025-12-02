const express = require("express");
const router = express.Router();

const publicRoutes = require("./public");
const schoolsRoutes = require("./schools");
const studentsRoutes = require("./students");

router.use("/public", publicRoutes);
router.use("/schools", schoolsRoutes);
router.use("/students", studentsRoutes);

module.exports = router;
