const express = require("express");
const router = express.Router();

const usersRoutes = require("./users.routes");
const refreshTokenRoutes = require("./refreshToken.routes");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

router.use("/refresh-tokens", checkAuth, refreshTokenRoutes);
router.use("/users", checkAuth, usersRoutes);

module.exports = router;
