const express = require("express");
const router = express.Router();
const refreshTokenController = require("../../controllers/system-admin/refreshToken.controller");

/**
 * @swagger
 * tags:
 *   name: System Admin - Refresh Tokens
 *   description: API quản lý refresh tokens
 */

/**
 * @swagger
 * /api/v1/system-admin/refresh-tokens:
 *   get:
 *     summary: Lấy danh sách refresh tokens
 *     tags: [System Admin - Refresh Tokens]
 *     security:
 *       - bearerAuth: []
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
 *         name: revoked
 *         schema:
 *           type: boolean
 *         description: Lọc token đã bị revoke (true/false)
 *       - in: query
 *         name: expired
 *         schema:
 *           type: boolean
 *         description: Lọc token đã hết hạn (true/false)
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
 *                   example: Get all refresh tokens successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RefreshToken'
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
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */
router.get("/", refreshTokenController.getAllRefreshTokens);

/**
 * @swagger
 * /api/v1/system-admin/refresh-tokens/{id}/revoke:
 *   put:
 *     summary: Thu hồi (revoke) một refresh token theo ID
 *     tags: [System Admin - Refresh Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Token ID (primary key trong database)
 *     responses:
 *       200:
 *         description: Revoke thành công
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
 *                   example: Token revoked successfully
 *                 data:
 *                   $ref: '#/components/schemas/RefreshToken'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy token
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/revoke", refreshTokenController.revokeRefreshToken);

/**
 * @swagger
 * /api/v1/system-admin/refresh-tokens/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn một refresh token theo ID
 *     tags: [System Admin - Refresh Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Token ID (primary key trong database)
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
 *                   example: Refresh token deleted permanently
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy token
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", refreshTokenController.deleteRefreshToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     RefreshToken:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Primary key của token trong database
 *           example: abc-123-def-456
 *         token_id:
 *           type: string
 *           description: Unique token ID string
 *           example: unique-token-id-string
 *         token_hash:
 *           type: string
 *           description: Hashed token value
 *           example: $2b$10$abcdefghijklmnopqrstuvwxyz
 *         user_id:
 *           type: string
 *           description: ID của user sở hữu token
 *           example: user-abc-123
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian token hết hạn
 *           example: 2025-12-31T23:59:59.000Z
 *         revoked_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Thời gian token bị thu hồi (null nếu chưa revoke)
 *           example: null
 *         ip_address:
 *           type: string
 *           description: IP address khi tạo token
 *           example: 192.168.1.1
 *         user_agent:
 *           type: string
 *           description: User agent khi tạo token
 *           example: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo token
 *           example: 2025-11-02T10:00:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật cuối
 *           example: 2025-11-02T10:00:00.000Z
 */

module.exports = router;
