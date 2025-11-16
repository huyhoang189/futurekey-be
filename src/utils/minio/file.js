const { minioClient } = require("./client");

/**
 * Upload file dạng buffer
 */
const uploadBuffer = async (bucket, objectKey, buffer, mimeType) => {
  return minioClient.putObject(bucket, objectKey, buffer, {
    "Content-Type": mimeType,
  });
};

/**
 * Upload file dạng stream (dùng cho video lớn)
 */
const uploadStream = async (bucket, objectKey, stream, size, mimeType) => {
  return minioClient.putObject(bucket, objectKey, stream, size, {
    "Content-Type": mimeType,
  });
};

/**
 * Lấy metadata (file size, content-type, etag,…)
 */
const getStat = async (bucket, objectKey) => {
  return minioClient.statObject(bucket, objectKey);
};

/**
 * Lấy file dạng stream (PDF, ảnh, file)
 */
const getFileStream = async (bucket, objectKey) => {
  return minioClient.getObject(bucket, objectKey);
};

/**
 * Lấy một phần file (dùng cho VIDEO streaming)
 */
const getFileRange = async (bucket, objectKey, start, length) => {
  return minioClient.getPartialObject(bucket, objectKey, start, length);
};

/**
 * Tạo URL truy cập tạm thời (presigned URL)
 */
const getPresignedUrl = async (bucket, objectKey, expiry = 600) => {
  return minioClient.presignedGetObject(bucket, objectKey, expiry);
};

/**
 * Xóa object trên MinIO
 */
const removeFile = async (bucket, objectKey) => {
  return minioClient.removeObject(bucket, objectKey);
};

module.exports = {
  uploadBuffer,
  uploadStream,
  getStat,
  getFileStream,
  getFileRange,
  getPresignedUrl,
  removeFile,
};
