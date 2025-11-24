const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");

const systemAdminRoutes = require("./system-admin");
const careersManageRoutes = require("./careers-manage");
const schoolManageRoutes = require("./school-manage");
const checkAuth = require("../../../middlewares/authentication/checkAuth");
const checkAdminRole = require("../../../middlewares/authentication/checkAdmin");

router.use("/auth", authRoutes);
router.use("/system-admin", checkAuth, checkAdminRole, systemAdminRoutes);
router.use("/careers-manage", checkAuth, checkAdminRole, careersManageRoutes);
router.use("/school-manage", checkAuth, checkAdminRole, schoolManageRoutes);

module.exports = router;
