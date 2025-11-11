const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createMetadata = async (data) => {
  return await prisma.metadata.create({
    data: {
      object_type: data.objectType,
      object_id: data.objectId,
      file_name: data.fileName,
      file_path: data.filePath,
      bucket_name: data.bucketName,
      file_size: data.fileSize,
      mine_type: data.mimeType,
      file_extension: data.fileExtension,
      is_public: data.isPublic,
      metadata: data.metadata || {},
    },
  });
};

const getMetadataById = async (id) => {
  return await prisma.metadata.findUnique({
    where: { id },
  });
};

const getFilesByObject = async (objectType, objectId) => {
  return await prisma.metadata.findMany({
    where: {
      object_type: objectType,
      object_id: objectId,
    },
  });
};

const getLatestFile = async (objectType, objectId) => {
  const files = await prisma.metadata.findMany({
    where: {
      objectType,
      objectId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  });

  return files[0] || null;
};

const updateMetadata = async (id, updateData) => {
  return await prisma.metadata.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
  });
};

const deleteMetadata = async (id) => {
  return await prisma.metadata.delete({
    where: { id },
  });
};

const checkFileExists = async (objectType, objectId, fileName) => {
  const existing = await prisma.metadata.findFirst({
    where: {
      objectType,
      objectId,
      fileName,
    },
  });

  return !!existing;
};

module.exports = {
  createMetadata,
  getMetadataById,
  getFilesByObject,
  getLatestFile,
  updateMetadata,
  deleteMetadata,
  checkFileExists,
};
