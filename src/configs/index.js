const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  api: {
    port: process.env.PORT || 3030,
  },
  secretKeyJWT: process.env.SECRET_KEY,
};

module.exports = config;
