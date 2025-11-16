const multer = require("multer");
const path = require("path");

// Cấu hình multer để lưu file tạm trong memory
const storage = multer.memoryStorage();

// Filter cho ảnh
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Filter cho video
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mov|wmv|flv|mkv/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error("Only video files are allowed (mp4, avi, mov, wmv, flv, mkv)")
    );
  }
};

// Tạo middleware upload với limit khác nhau
const createUploadMiddleware = (filter, maxSize) => {
  return multer({
    storage,
    fileFilter: filter,
    limits: {
      fileSize: maxSize,
    },
  });
};

// Filter cho file documents (attachments)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error("File type not allowed"));
  }
};

// Filter cho cả image và video
const mediaFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|wmv|flv|mkv/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype =
    file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"));
  }
};

// Export các middleware
const uploadImage = createUploadMiddleware(imageFilter, 5 * 1024 * 1024); // 5MB
const uploadVideo = createUploadMiddleware(videoFilter, 100 * 1024 * 1024); // 100MB
const uploadFile = createUploadMiddleware(fileFilter, 10 * 1024 * 1024); // 10MB
const uploadMedia = createUploadMiddleware(mediaFilter, 100 * 1024 * 1024); // 100MB

// Middleware cho criteria: video thumb + video + attachments
const uploadCriteriaFiles = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per file
  },
}).fields([
  { name: "video_thumbnail", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "attachments", maxCount: 10 },
]);

module.exports = {
  uploadImage,
  uploadVideo,
  uploadFile,
  uploadMedia,
  uploadCriteriaFiles,
};
