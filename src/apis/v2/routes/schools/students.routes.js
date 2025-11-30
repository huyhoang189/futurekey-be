const express = require("express");
const router = express.Router();
const pagination = require("../../../../middlewares/validation/pagination");
const multer = require("multer");
const studentsController = require("../../controllers/schools/students.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Students
 *   description: API quản lý học sinh theo lớp cho trường
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SchoolStudent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         school_id:
 *           type: string
 *         class_id:
 *           type: string
 *         student_code:
 *           type: string
 *         sex:
 *           type: string
 *           enum: [OTHER, MALE, FEMALE]
 *         birthday:
 *           type: string
 *           format: date
 *         description:
 *           type: string
 *         major_interest:
 *           type: string
 *         user:
 *           type: object
 *         school:
 *           type: object
 *         class:
 *           type: object
 */

/**
 * @swagger
 * /api/v2/schools/students:
 *   get:
 *     summary: Lấy danh sách học sinh theo lớp
 *     tags: [V2 - Schools - Students]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp cần lấy học sinh
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mô tả hoặc sở thích
 *       - in: query
 *         name: sex
 *         schema:
 *           type: string
 *           enum: [OTHER, MALE, FEMALE]
 *         description: Lọc theo giới tính
 *     responses:
 *       200:
 *         description: Danh sách học sinh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SchoolStudent'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     skip:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     page:
 *                       type: integer
 */
router.get("/", pagination, studentsController.getAllStudents);

/**
 * @swagger
 * /api/v2/schools/students/download-template:
 *   get:
 *     summary: Tải template Excel import học sinh
 *     tags: [V2 - Schools - Students]
 *     responses:
 *       200:
 *         description: File template
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Không tìm thấy file
 */
router.get("/download-template", studentsController.downloadTemplate);

/**
 * @swagger
 * /api/v2/schools/students/import:
 *   post:
 *     summary: Import học sinh từ Excel vào một lớp
 *     tags: [V2 - Schools - Students]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lớp nhận data import
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import thành công (hoặc trả về file lỗi)
 */
router.post(
  "/import",
  upload.single("file"),
  studentsController.importStudents
);

/**
 * @swagger
 * /api/v2/schools/students/{id}:
 *   get:
 *     summary: Lấy học sinh theo ID
 *     tags: [V2 - Schools - Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin học sinh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolStudent'
 */
router.get("/:id", studentsController.getStudentById);

/**
 * @swagger
 * /api/v2/schools/students:
 *   post:
 *     summary: Tạo mới học sinh (và tài khoản user)
 *     tags: [V2 - Schools - Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - full_name
 *             properties:
 *               user_name:
 *                 type: string
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: string
 *               class_id:
 *                 type: string
 *               sex:
 *                 type: string
 *                 enum: [OTHER, MALE, FEMALE]
 *               birthday:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               major_interest:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo học sinh thành công
 */
router.post("/", studentsController.createStudent);

/**
 * @swagger
 * /api/v2/schools/students/{id}:
 *   put:
 *     summary: Cập nhật học sinh và user
 *     tags: [V2 - Schools - Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student:
 *                 type: object
 *               base_user:
 *                 type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", studentsController.updateStudent);

/**
 * @swagger
 * /api/v2/schools/students/{id}:
 *   delete:
 *     summary: Xóa học sinh (có thể xóa user)
 *     tags: [V2 - Schools - Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: deleteUser
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:id", studentsController.deleteStudent);

module.exports = router;
