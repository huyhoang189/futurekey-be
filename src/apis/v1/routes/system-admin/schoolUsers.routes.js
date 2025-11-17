const express = require("express");
const router = express.Router();
const schoolUsersController = require("../../controllers/system-admin/schoolUsers.controller");
const pagination = require("../../../../middlewares/validation/pagination");
const multer = require("multer");

// Cấu hình multer để xử lý file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * @swagger
 * /api/v1/system-admin/school-users:
 *   get:
 *     summary: Lấy danh sách school users
 *     tags: [School Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mô tả
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: string
 *         description: Lọc theo trường học
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
 *                   example: "Get all school users successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SchoolUserResponse'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get("/", pagination, schoolUsersController.getAllSchoolUsers);

/**
 * @swagger
 * /api/v1/system-admin/school-users/download-template:
 *   get:
 *     summary: Download template Excel để import teachers
 *     tags: [School Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File template Excel
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Không tìm thấy file template
 *       500:
 *         description: Lỗi server
 */
router.get("/download-template", schoolUsersController.downloadTemplate);

/**
 * @swagger
 * /api/v1/system-admin/school-users/import:
 *   post:
 *     summary: Import danh sách teachers từ file Excel
 *     tags: [School Users]
 *     security:
 *       - bearerAuth: []
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
 *                 description: File Excel chứa danh sách teachers (.xlsx, .xls)
 *     responses:
 *       200:
 *         description: Import thành công (hoặc trả về file lỗi nếu có)
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
 *                   example: Import completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     success_count:
 *                       type: integer
 *                       example: 95
 *                     error_count:
 *                       type: integer
 *                       example: 5
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *               description: File Excel chứa các row bị lỗi (nếu có)
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/import", upload.single("file"), schoolUsersController.importSchoolUsers);

/**
 * @swagger
 * /api/v1/system-admin/school-users/{id}:
 *   get:
 *     summary: Lấy thông tin school user theo ID
 *     tags: [School Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của school user
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
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
 *                   example: "Get school user successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SchoolUserResponse'
 *       404:
 *         description: Không tìm thấy school user
 */
router.get("/:id", schoolUsersController.getSchoolUserById);

/**
 * @swagger
 * /api/v1/system-admin/school-users:
 *   post:
 *     summary: Tạo mới school user (tự động tạo tài khoản user)
 *     tags: [School Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - full_name
 *               - school_id
 *             properties:
 *               user_name:
 *                 type: string
 *                 description: Tên đăng nhập
 *                 example: "teacher001"
 *               full_name:
 *                 type: string
 *                 description: Họ và tên
 *                 example: "Nguyễn Văn A"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email
 *                 example: "teacher001@school.edu.vn"
 *               phone_number:
 *                 type: string
 *                 description: Số điện thoại
 *                 example: "0912345678"
 *               password:
 *                 type: string
 *                 description: Mật khẩu (mặc định là 123456)
 *                 example: "mypassword"
 *               address:
 *                 type: string
 *                 description: Địa chỉ
 *                 example: "Hà Nội"
 *               school_id:
 *                 type: string
 *                 description: ID trường học
 *                 example: "school-001"
 *               description:
 *                 type: string
 *                 description: Mô tả vai trò
 *                 example: "Giáo viên môn Toán"
 *     responses:
 *       201:
 *         description: Tạo thành công
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
 *                   example: "Create school user successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SchoolUserResponse'
 *       400:
 *         description: Lỗi validation
 */
router.post("/", schoolUsersController.createSchoolUser);

/**
 * @swagger
 * /api/v1/system-admin/school-users/{id}:
 *   put:
 *     summary: Cập nhật thông tin school user và user
 *     tags: [School Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của school user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               school_user:
 *                 type: object
 *                 description: Thông tin school user (auth_impl_user_school)
 *                 properties:
 *                   school_id:
 *                     type: string
 *                     description: ID trường học
 *                     example: "school-002"
 *                   description:
 *                     type: string
 *                     description: Mô tả vai trò
 *                     example: "Giáo viên môn Lý"
 *               base_user:
 *                 type: object
 *                 description: Thông tin user cơ bản (auth_base_user)
 *                 properties:
 *                   user_name:
 *                     type: string
 *                     description: Tên đăng nhập
 *                     example: "teacher002"
 *                   full_name:
 *                     type: string
 *                     description: Họ và tên
 *                     example: "Trần Thị B"
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Email
 *                     example: "teacher002@school.edu.vn"
 *                   phone_number:
 *                     type: string
 *                     description: Số điện thoại
 *                     example: "0987654321"
 *                   address:
 *                     type: string
 *                     description: Địa chỉ
 *                     example: "TP.HCM"
 *                   status:
 *                     type: string
 *                     enum: [ACTIVE, INACTIVE]
 *                     description: Trạng thái tài khoản
 *                     example: "ACTIVE"
 *           example:
 *             school_user:
 *               school_id: "school-002"
 *               description: "Giáo viên chủ nhiệm lớp 10A1"
 *             base_user:
 *               user_name: "teacher_nguyen"
 *               full_name: "Nguyễn Thị C"
 *               email: "nguyenthic@school.edu.vn"
 *               phone_number: "0912345678"
 *               address: "Hà Nội"
 *               status: "ACTIVE"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                   example: "Update school user successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SchoolUserResponse'
 *       400:
 *         description: Lỗi validation (username/email đã tồn tại, school không tồn tại)
 *       404:
 *         description: Không tìm thấy school user
 */
router.put("/:id", schoolUsersController.updateSchoolUser);

/**
 * @swagger
 * /api/v1/system-admin/school-users/{id}/user:
 *   put:
 *     summary: Cập nhật thông tin user của school user
 *     tags: [School Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của school user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *                 description: Tên đăng nhập
 *                 example: "teacher002"
 *               full_name:
 *                 type: string
 *                 description: Họ và tên
 *                 example: "Trần Thị B"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email
 *                 example: "teacher002@school.edu.vn"
 *               phone_number:
 *                 type: string
 *                 description: Số điện thoại
 *                 example: "0987654321"
 *               address:
 *                 type: string
 *                 description: Địa chỉ
 *                 example: "TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                   example: "Update school user info successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.put("/:id/user", schoolUsersController.updateSchoolUserUser);

/**
 * @swagger
 * /api/v1/system-admin/school-users/{id}:
 *   delete:
 *     summary: Xóa school user
 *     tags: [School Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của school user
 *       - in: query
 *         name: deleteUser
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Có xóa luôn tài khoản user không
 *     responses:
 *       200:
 *         description: Xóa thành công
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
 *                   example: "Delete school user successfully"
 */
router.delete("/:id", schoolUsersController.deleteSchoolUser);

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
 *           example: "Giáo viên môn Toán"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T08:30:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T08:30:00.000Z"
 *         user:
 *           $ref: '#/components/schemas/User'
 *         school:
 *           $ref: '#/components/schemas/School'
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 10
 */

module.exports = router;