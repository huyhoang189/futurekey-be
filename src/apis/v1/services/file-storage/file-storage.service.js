const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  uploadBuffer,
  removeFile,
  getPresignedUrl,
} = require("../../../../utils/minio/file");
const metadataService = require("./metadata.service");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { FR, MINIO_BUCKETS } = require("../../../../common");
const { minio: minioConfig } = require("../../../../configs");

const CURRENT_FR = FR.FR00013;

/**
 * Upload file lên MinIO và lưu metadata
 * @param {Object} params
 * @param {Buffer} params.fileBuffer - File buffer từ multer
 * @param {String} params.fileName - Tên file gốc
 * @param {String} params.mimeType - MIME type
 * @param {Number} params.fileSize - Kích thước file
 * @param {String} params.objectType - Loại object (CAREER_THUMBS, AVATAR,...)
 * @param {String} params.objectId - ID của object (career ID, user ID,...)
 * @param {String} params.bucketName - Tên bucket từ MINIO_BUCKETS
 * @param {String} params.uploadBy - User ID người upload
 * @returns {Object} - {id, fileUrl, metadata}
 */
const uploadFile = async ({
  fileBuffer,
  fileName,
  mimeType,
  fileSize,
  objectType,
  objectId,
  bucketName,
  uploadBy = null,
}) => {
  try {
    if (!fileBuffer) {
      throw new Error("File buffer is required");
    }

    if (!fileName || !mimeType || !objectType || !objectId || !bucketName) {
      throw new Error(
        "fileName, mimeType, objectType, objectId, bucketName are required"
      );
    }

    // Generate unique file name
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const objectKey = `${objectType}_${objectId}_${uniqueFileName}`;

    // Upload to MinIO
    await uploadBuffer(bucketName, objectKey, fileBuffer, mimeType);

    // Generate presigned URL (7 days expiry)
    const fileUrl = await getPresignedUrl(
      bucketName,
      objectKey,
      7 * 24 * 60 * 60
    );

    // Save metadata to database
    const fileMetadata = await metadataService.createMetadata({
      objectType,
      objectId,
      fileName,
      filePath: objectKey,
      bucketName,
      fileSize,
      mimeType,
      fileExtension,
      metadata: {
        originalFileName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return {
      id: fileMetadata.id,
      fileUrl,
      objectKey,
      metadata: fileMetadata,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - Upload file error: ${error.message}`);
  }
};

/**
 * Lấy file URL từ metadata
 * @param {String} objectType - Loại object
 * @param {String} objectId - ID của object
 * @returns {String|null} - File URL hoặc null
 */
const getFileUrl = async (objectType, objectId) => {
  try {
    const files = await metadataService.getFilesByObject(objectType, objectId);

    if (!files || files.length === 0) {
      return null;
    }

    // Lấy file đầu tiên
    const file = files[0];

    // Generate presigned URL (7 days expiry)
    const fileUrl = await getPresignedUrl(
      file.bucket_name,
      file.file_path,
      7 * 24 * 60 * 60
    );

    return fileUrl;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - Get file URL error: ${error.message}`);
  }
};

/**
 * Lấy metadata đầu tiên của object
 * @param {String} objectType - Loại object
 * @param {String} objectId - ID của object
 * @returns {Object|null} - Metadata với fileUrl hoặc null
 */
const getFirstMetadata = async (objectType, objectId) => {
  try {
    const files = await metadataService.getFilesByObject(objectType, objectId);

    if (!files || files.length === 0) {
      return null;
    }

    const file = files[0];

    // Generate presigned URL (7 days expiry)
    const fileUrl = await getPresignedUrl(
      file.bucket_name,
      file.file_path,
      7 * 24 * 60 * 60
    );

    return {
      ...file,
      fileUrl,
    };
  } catch (error) {
    throw new Error(
      `${CURRENT_FR} - Get first metadata error: ${error.message}`
    );
  }
};

/**
 * Lấy tất cả files của object
 * @param {String} objectType - Loại object
 * @param {String} objectId - ID của object
 * @returns {Array} - Danh sách files với URL
 */
const getFilesByObject = async (objectType, objectId) => {
  try {
    const files = await metadataService.getFilesByObject(objectType, objectId);

    // Generate presigned URLs for all files (7 days expiry)
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        fileUrl: await getPresignedUrl(
          file.bucket_name,
          file.file_path,
          7 * 24 * 60 * 60
        ),
      }))
    );

    return filesWithUrls;
  } catch (error) {
    throw new Error(
      `${CURRENT_FR} - Get files by object error: ${error.message}`
    );
  }
};

/**
 * Update file - Xóa file cũ và upload file mới
 * @param {String} objectType - Loại object
 * @param {String} objectId - ID của object
 * @param {Object} params - Tham số giống uploadFile
 * @returns {Object} - {id, fileUrl, metadata}
 */
const updateFile = async (objectType, objectId, fileParams) => {
  try {
    // Lấy file cũ
    const oldFiles = await metadataService.getFilesByObject(
      objectType,
      objectId
    );

    // Xóa file cũ từ MinIO và metadata
    for (const oldFile of oldFiles) {
      try {
        await removeFile(oldFile.bucket_name, oldFile.file_path);
        await metadataService.deleteMetadata(oldFile.id);
      } catch (error) {
        console.warn(
          `Warning: Could not delete old file ${oldFile.id}:`,
          error.message
        );
      }
    }

    // Upload file mới
    return await uploadFile({
      ...fileParams,
      objectType,
      objectId,
    });
  } catch (error) {
    throw new Error(`${CURRENT_FR} - Update file error: ${error.message}`);
  }
};

/**
 * Xóa tất cả files của một object
 * @param {String} objectType - Loại object
 * @param {String} objectId - ID của object
 * @returns {Object} - {success, deletedCount}
 */
const deleteFilesByObject = async (objectType, objectId) => {
  try {
    const files = await metadataService.getFilesByObject(objectType, objectId);

    let deletedCount = 0;

    for (const file of files) {
      try {
        await removeFile(file.bucket_name, file.file_path);
        await metadataService.deleteMetadata(file.id);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting file ${file.id}:`, error.message);
      }
    }

    return {
      success: true,
      deletedCount,
      total: files.length,
    };
  } catch (error) {
    throw new Error(
      `${CURRENT_FR} - Delete files by object error: ${error.message}`
    );
  }
};

module.exports = {
  uploadFile,
  getFileUrl,
  getFirstMetadata,
  getFilesByObject,
  updateFile,
  deleteFilesByObject,
};
