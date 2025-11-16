// logger.js
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

// Tùy chỉnh định dạng log
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(), // Ghi log vào console
    new transports.File({ filename: "logs/error.log", level: "error" }), // Log lỗi vào file
    new transports.File({ filename: "logs/combined.log" }), // Ghi toàn bộ log vào file
  ],
});

// Nếu muốn xoay vòng log (rotating logs) theo ngày
const DailyRotateFile = require("winston-daily-rotate-file");
logger.add(
  new DailyRotateFile({
    filename: "logs/application-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true, // Nén file log cũ
    maxSize: "20m", // Kích thước tối đa của file log
    maxFiles: "14d", // Giữ log trong 14 ngày
  })
);

module.exports = logger;
