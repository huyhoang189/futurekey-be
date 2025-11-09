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
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

router.use("/refresh-tokens", checkAuth, refreshTokenRoutes);
router.use("/users", checkAuth, usersRoutes);
router.use("/groups", checkAuth, groupsRoutes);
router.use("/roles", checkAuth, rolesRoutes);
router.use("/schools", checkAuth, schoolsRoutes);
router.use("/classes", checkAuth, classesRoutes);
router.use("/communes", checkAuth, communesRoutes);
router.use("/provinces", checkAuth, provincesRoutes);
router.use("/students", checkAuth, studentsRoutes);
router.use("/school-users", checkAuth, schoolUsersRoutes);

module.exports = router;
