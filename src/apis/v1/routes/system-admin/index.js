const express = require("express");
const router = express.Router();

const usersRoutes = require("./users.routes");
const refreshTokenRoutes = require("./refreshToken.routes");
const groupsRoutes = require("./groups.routes");
const rolesRoutes = require("./roles.routes");
const schoolsRoutes = require("./schools.routes");
const classesRoutes = require("./classes.routes");
const communesRoutes = require("./communes.routes");
const provincesRoutes = require("./provinces.routes");
const studentsRoutes = require("./students.routes");
const schoolUsersRoutes = require("./schoolUsers.routes");
const statisticsRoutes = require("./statistics.routes");

router.use("/refresh-tokens", refreshTokenRoutes);
router.use("/users", usersRoutes);
router.use("/groups", groupsRoutes);
router.use("/roles", rolesRoutes);
router.use("/schools", schoolsRoutes);
router.use("/classes", classesRoutes);
router.use("/communes", communesRoutes);
router.use("/provinces", provincesRoutes);
router.use("/students", studentsRoutes);
router.use("/school-users", schoolUsersRoutes);
router.use("/statistics", statisticsRoutes);

module.exports = router;
