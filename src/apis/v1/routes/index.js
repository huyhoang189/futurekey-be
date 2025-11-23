const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");

const systemAdminRoutes = require("./system-admin");
const careersManageRoutes = require("./careers-manage");
const schoolManageRoutes = require("./school-manage");

router.use("/auth", authRoutes);
router.use("/system-admin", systemAdminRoutes);
router.use("/careers-manage", careersManageRoutes);
router.use("/school-manage", schoolManageRoutes);

module.exports = router;
