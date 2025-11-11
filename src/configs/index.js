const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  api: {
    port: process.env.PORT || 3030,
  },
  secretKeyJWT: process.env.SECRET_KEY,
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  },
};

module.exports = config;
