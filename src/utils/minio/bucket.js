const { createMinioClient, BUCKETS, getBucketPolicy } = require("./client");

export const initalizeBucket = async () => {
  const minioClient = createMinioClient();

  const bucketConfigs = [
    { name: BUCKETS.PUBLIC, policy: "public" },
    { name: BUCKETS.MEDIA, policy: "private" },
    { name: BUCKETS.SYSTEM, policy: "private" },
  ];

  for (const config of bucketConfigs) {
    const exists = await minioClient.bucketExists(config.name);
    if (!exists) {
      await minioClient.makeBucket(config.name);
      await minioClient.setBucketPolicy(
        config.name,
        getBucketPolicy(config.name)
      );
      console.log(`Bucket ${config.name} initialized`);
    }
  }
};

export const getBucketForObjectType = (objectType) => {
  const bucketMap = {
    user_avatar: BUCKETS.PUBLIC,
    career_thumbnail: BUCKETS.PUBLIC,
    criteria_thumbnail: BUCKETS.PUBLIC,
    criteria_video: BUCKETS.MEDIA,
    criteria_file: BUCKETS.MEDIA,
  };

  return bucketMap[objectType] || BUCKETS.MEDIA;
};

// Check if file type should be public
export const isPublicObjectType = (objectType) => {
  const publicTypes = ["user_avatar", "career_thumbnail", "criteria_thumbnail"];
  return publicTypes.includes(objectType);
};
