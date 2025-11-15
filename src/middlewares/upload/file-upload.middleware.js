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

// Export các middleware
const uploadImage = createUploadMiddleware(imageFilter, 5 * 1024 * 1024); // 5MB
const uploadVideo = createUploadMiddleware(videoFilter, 100 * 1024 * 1024); // 100MB

module.exports = {
  uploadImage,
  uploadVideo,
};
