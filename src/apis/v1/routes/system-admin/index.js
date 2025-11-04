const express = require("express");
const router = express.Router();

const usersRoutes = require("./users.routes");
const refreshTokenRoutes = require("./refreshToken.routes");
const groupsRoutes = require("./groups.routes");
const rolesRoutes = require("./roles.routes");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

router.use("/refresh-tokens", checkAuth, refreshTokenRoutes);
router.use("/users", checkAuth, usersRoutes);
router.use("/groups", checkAuth, groupsRoutes);
router.use("/roles", checkAuth, rolesRoutes);

module.exports = router;
