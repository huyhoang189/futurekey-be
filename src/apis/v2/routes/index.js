const express = require("express");
const router = express.Router();

const publicRoutes = require("./public");

router.use("/public", publicRoutes);

module.exports = router;
