const path = require("path");
const { v4: uuidv4 } = require("uuid");

export const generateFilePath = ({
  objectType,
  objectId,
  originalName,
  additionalPath = "",
}) => {
  const fileExt = path.extname(originalName);
  const fileId = uuidv4();

  const pathTemplates = {
    user_avatar: `avatars/user_${objectId}/avatar${fileExt}`,
    career_thumbnail: `careers/${objectId}/thumbnail${fileExt}`,
    criteria_thumbnail: `careers/${additionalPath}/criteria/${objectId}/thumbnail${fileExt}`,
    criteria_video: `careers/${additionalPath}/criteria/${objectId}/videos/video_${fileId}${fileExt}`,
    criteria_file: `careers/${additionalPath}/criteria/${objectId}/files/file_${fileId}${fileExt}`,
  };

  return (
    pathTemplates[objectType] ||
    `general/${objectType}/${objectId}/${fileId}${fileExt}`
  );
};

// Validate file type
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.some((type) => file.mimetype.startsWith(type));
};

// Get file type category
export const getFileCategory = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  return "other";
};
