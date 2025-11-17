const { Client } = require("minio");
const { minio: minioConfig } = require("../../configs");

const minioClient = new Client({
  endPoint: minioConfig.endpoint,
  port: parseInt(minioConfig.port),
  useSSL: minioConfig.useSSL,
  accessKey: minioConfig.accessKey,
  secretKey: minioConfig.secretKey,
});

module.exports = { minioClient };
