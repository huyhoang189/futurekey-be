const express = require("express");
const router = express.Router();
const usersController = require("../../controllers/system-admin/users.controller");
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
 * tags:
 *   name: System Admin - Users
 *   description: API quản lý người dùng
 */

/**
 * @swagger
 * /api/v1/system-admin/users:
 *   get:
 *     summary: Lấy danh sách users
 *     tags: [System Admin - Users]
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
 *         description: Số lượng items mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo username, full_name, email, phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNER]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: string
 *         description: Lọc theo group ID
 *     responses:
 *       200:
 *         description: Thành công
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
 *                   example: Get all users successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     skip:
 *                       type: integer
 *                       example: 0
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     page:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Lỗi server
 */
router.get("/", usersController.getAllUsers);

/**
 * @swagger
 * /api/v1/system-admin/users:
 *   post:
 *     summary: Tạo mới user
 *     tags: [System Admin - Users]
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
 *               - email
 *             properties:
 *               user_name:
 *                 type: string
 *                 example: johndoe
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone_number:
 *                 type: string
 *                 example: 0123456789
 *               address:
 *                 type: string
 *                 example: 123 Street, City
 *               description:
 *                 type: string
 *                 example: User description
 *               group_id:
 *                 type: string
 *                 example: abc-123-def
 *               password:
 *                 type: string
 *                 example: password123
 *                 description: Nếu không truyền sẽ dùng mật khẩu mặc định
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
 *                   example: Create user successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/", usersController.createUser);

/**
 * @swagger
 * /api/v1/system-admin/users/download-template:
 *   get:
 *     summary: Download file template import users
 *     tags: [System Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Download file thành công
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
router.get("/download-template", usersController.downloadTemplate);

/**
 * @swagger
 * /api/v1/system-admin/users/import:
 *   post:
 *     summary: Import danh sách users từ file Excel
 *     tags: [System Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File Excel (.xlsx, .xls)
 *     responses:
 *       200:
 *         description: Import thành công
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
 *                   example: "Import completed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 10
 *                       description: Tổng số dòng trong file
 *                     success_count:
 *                       type: integer
 *                       example: 8
 *                       description: Số user import thành công
 *                     error_count:
 *                       type: integer
 *                       example: 2
 *                       description: Số user import thất bại
 *                     results:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               row:
 *                                 type: integer
 *                                 example: 3
 *                               user:
 *                                 type: object
 *                         errors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               row:
 *                                 type: integer
 *                                 example: 4
 *                               user_name:
 *                                 type: string
 *                                 example: "example"
 *                               error:
 *                                 type: string
 *                                 example: "Tên đăng nhập đã tồn tại"
 *       400:
 *         description: Lỗi validation (không có file, sai định dạng)
 *       500:
 *         description: Lỗi server
 */
router.post("/import", upload.single("file"), usersController.importUsers);

/**
 * @swagger
 * /api/v1/system-admin/users/{id}:
 *   put:
 *     summary: Cập nhật profile user
 *     tags: [System Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               group_id:
 *                 type: string
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
 *                   example: Update user successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", usersController.updateProfile);

/**
 * @swagger
 * /api/v1/system-admin/users/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn user
 *     tags: [System Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *                   example: User deleted permanently
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", usersController.deleteUser);

/**
 * @swagger
 * /api/v1/system-admin/users/{id}/ban:
 *   put:
 *     summary: Ban user (chặn người dùng)
 *     tags: [System Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Ban thành công
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
 *                   example: User banned successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: User không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/ban", usersController.banUser);

/**
 * @swagger
 * /api/v1/system-admin/users/{id}/active:
 *   put:
 *     summary: Active user (kích hoạt người dùng)
 *     tags: [System Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Kích hoạt thành công
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
 *                   example: User activated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: User không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/active", usersController.activeUser);

/**
 * @swagger
 * /api/v1/system-admin/users/{id}/inactive:
 *   put:
 *     summary: Inactive user (vô hiệu hóa người dùng)
 *     tags: [System Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
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
 *                   example: User inactivated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: User không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/inactive", usersController.inactiveUser);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def-456
 *         user_name:
 *           type: string
 *           example: johndoe
 *         full_name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         phone_number:
 *           type: string
 *           example: 0123456789
 *         address:
 *           type: string
 *           example: 123 Street, City
 *         description:
 *           type: string
 *           example: User description
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNER]
 *           example: ACTIVE
 *         group_id:
 *           type: string
 *           example: group-123
 *         latest_login:
 *           type: string
 *           format: date-time
 *         login_attempts:
 *           type: integer
 *           example: 0
 *         lockout_util:
 *           type: string
 *           format: date-time
 *         last_seen_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = router;
