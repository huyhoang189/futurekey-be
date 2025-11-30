const express = require("express");
const router = express.Router();
const pagination = require("../../../../middlewares/validation/pagination");
const multer = require("multer");
const schoolUserController = require("../../controllers/schools/schoolUser.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - School Users
 *   description: API dành cho trường quản lý giáo viên/nhân sự
 */

/**
 * @swagger
 * /api/v2/schools/school-users:
 *   get:
 *     summary: Lấy danh sách school users của trường hiện tại
 *     tags: [V2 - Schools - School Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mô tả hoặc liên kết với user/school
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Get all school users successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SchoolUserResponse'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get("/", pagination, schoolUserController.getAllSchoolUsers);

/**
 * @swagger
 * /api/v2/schools/school-users/download-template:
 *   get:
 *     summary: Tải về template Excel để import giáo viên
 *     tags: [V2 - Schools - School Users]
 *     responses:
 *       200:
 *         description: File template
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Template không tồn tại
 */
router.get("/download-template", schoolUserController.downloadTemplate);

/**
 * @swagger
 * /api/v2/schools/school-users/import:
 *   post:
 *     summary: Import teacher từ file Excel
 *     tags: [V2 - Schools - School Users]
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
 *         description: Import thành công hoặc trả về file lỗi
 *       400:
 *         description: File không hợp lệ
 */
router.post(
  "/import",
  upload.single("file"),
  schoolUserController.importSchoolUsers
);

/**
 * @swagger
 * /api/v2/schools/school-users/{id}:
 *   get:
 *     summary: Lấy thông tin school user theo ID
 *     tags: [V2 - Schools - School Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của school user
 *     responses:
 *       200:
 *         description: Lấy thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Get school user successfully
 *                 data:
 *                   $ref: '#/components/schemas/SchoolUserResponse'
 */
router.get("/:id", schoolUserController.getSchoolUserById);

/**
 * @swagger
 * /api/v2/schools/school-users:
 *   post:
 *     summary: Tạo mới school user và tài khoản auth_base_user
 *     tags: [V2 - Schools - School Users]
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
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu trường dữ liệu
 */
router.post("/", schoolUserController.createSchoolUser);

/**
 * @swagger
 * /api/v2/schools/school-users/{id}:
 *   put:
 *     summary: Cập nhật school user và thông tin tài khoản
 *     tags: [V2 - Schools - School Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của school user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               school_user:
 *                 type: object
 *               base_user:
 *                 type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", schoolUserController.updateSchoolUser);

/**
 * @swagger
 * /api/v2/schools/school-users/{id}:
 *   delete:
 *     summary: Xóa school user
 *     tags: [V2 - Schools - School Users]
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
 *         description: Có xóa luôn tài khoản base user không
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:id", schoolUserController.deleteSchoolUser);

/**
 * @swagger
 * components:
 *   schemas:
 *     SchoolUserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "schooluser-001"
 *         user_id:
 *           type: string
 *           example: "user-001"
 *         school_id:
 *           type: string
 *           example: "school-001"
 *         description:
 *           type: string
 *           example: "Giáo viên chủ nhiệm"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *         school:
 *           type: object
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 100
 *         limit:
 *           type: integer
 *           example: 10
 *         skip:
 *           type: integer
 *           example: 0
 *         page:
 *           type: integer
 *           example: 1
 */
module.exports = router;
