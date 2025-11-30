const express = require("express");
const router = express.Router();
const authController = require("../controllers/system-admin/auth.controller");
const checkAuth = require("../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API xác thực (Authentication)
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - password
 *             properties:
 *               user_name:
 *                 type: string
 *                 example: user
 *                 description: Tên đăng nhập
 *               password:
 *                 type: string
 *                 example: 123456
 *                 description: Mật khẩu
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
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
 *                   example: Login successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                       description: JWT access token
 *                     refresh_token:
 *                       type: string
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *                       description: Refresh token (UUID)
 *                     expires_in:
 *                       type: integer
 *                       example: 900
 *                       description: Thời gian hết hạn của access token (giây)
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Thiếu thông tin đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Username is required
 *       401:
 *         description: Sai username hoặc password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid username or user is not active
 *       403:
 *         description: Tài khoản bị khóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Account is locked until 11/2/2025, 10:30:00 AM
 *       500:
 *         description: Lỗi server
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Làm mới token (Refresh Token)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: Refresh token nhận được khi đăng nhập
 *     responses:
 *       200:
 *         description: Làm mới token thành công
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
 *                   example: Refresh token successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                       description: JWT access token mới
 *                     refresh_token:
 *                       type: string
 *                       example: 660f9500-f39c-52e5-b827-557766551111
 *                       description: Refresh token mới (UUID)
 *                     expires_in:
 *                       type: integer
 *                       example: 900
 *                       description: Thời gian hết hạn của access token (giây)
 *       400:
 *         description: Thiếu refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Refresh token is required
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Token không hợp lệ hoặc đã hết hạn
 *       500:
 *         description: Lỗi server
 */
router.post("/refresh", authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Đăng xuất hệ thống
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: Refresh token nhận được khi đăng nhập
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
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
 *                   example: Đăng xuất thành công
 *       400:
 *         description: Thiếu refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Refresh token is required
 *       401:
 *         description: Token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Token không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /api/v1/auth/getme:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Lấy thông tin người dùng thành công
 */
router.get("/getme", checkAuth, authController.getMe);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary: Đổi mật khẩu (có thể thay cho user khác nếu có quyền)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - password
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID người dùng cần đổi mật khẩu
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Mật khẩu mới
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Thiếu id hoặc password
 *       403:
 *         description: Người dùng hiện tại không có quyền đổi mật khẩu cho tài khoản khác
 *       500:
 *         description: Lỗi server
 */
router.put("/change-password", checkAuth, authController.changePassword);

module.exports = router;
