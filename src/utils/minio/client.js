const { Client } = require("minio");
const { minio: minioConfig } = require("../../configs");

export const createMinioClient = () => {
  return new Client({
    endPoint: minioConfig.endpoint,
    port: parseInt(minioConfig.port),
    useSSL: minioConfig.useSSL,
    accessKey: minioConfig.accessKey,
    secretKey: minioConfig.secretKey,
  });
};

// Bucket configuration
export const BUCKETS = {
  PUBLIC: "career-public",
  MEDIA: "career-media",
  SYSTEM: "career-system",
};

// Bucket policies
export const getBucketPolicy = (bucketName) => {
  const policies = {
    [BUCKETS.PUBLIC]: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    },
    [BUCKETS.MEDIA]: {
      Version: "2012-10-17",
      Statement: [],
    },
    [BUCKETS.SYSTEM]: {
      Version: "2012-10-17",
      Statement: [],
    },
  };

  return JSON.stringify(policies[bucketName] || policies[BUCKETS.MEDIA]);
};
