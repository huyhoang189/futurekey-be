const express = require("express");

const router = express.Router();

const v1Routes = require("../apis/v1/routes");
const v2Routes = require("../apis/v2/routes");

router.use("/v1", v1Routes);
router.use("/v2", v2Routes);

module.exports = router;
