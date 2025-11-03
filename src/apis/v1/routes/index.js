const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");

const systemAdminRoutes = require("./system-admin");

router.use("/auth", authRoutes);
router.use("/system-admin", systemAdminRoutes);

module.exports = router;
