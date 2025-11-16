const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");

const systemAdminRoutes = require("./system-admin");
const careersManageRoutes = require("./careers-manage");

router.use("/auth", authRoutes);
router.use("/system-admin", systemAdminRoutes);
router.use("/careers-manage", careersManageRoutes);

module.exports = router;
