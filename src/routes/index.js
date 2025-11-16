const express = require("express");

const router = express.Router();

const v1Routes = require("../apis/v1/routes");

router.use("/v1", v1Routes);

module.exports = router;
