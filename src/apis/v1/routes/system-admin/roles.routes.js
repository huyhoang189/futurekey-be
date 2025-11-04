const express = require("express");
const router = express.Router();
const rolesController = require("../../controllers/system-admin/roles.controller");

/**
 * @swagger
 * tags:
 *   name: System Admin - Roles
 *   description: API quản lý vai trò/quyền
 */

/**
 * @swagger
 * /api/v1/system-admin/roles:
 *   get:
 *     summary: Lấy danh sách roles
 *     tags: [System Admin - Roles]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mô tả
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
 *                   example: Get all roles successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
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
 *       500:
 *         description: Lỗi server
 */
router.get("/", rolesController.getAllRoles);

/**
 * @swagger
 * /api/v1/system-admin/roles/{id}:
 *   get:
 *     summary: Lấy thông tin role theo ID
 *     tags: [System Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
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
 *                   example: Get role successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy role
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", rolesController.getRoleById);

/**
 * @swagger
 * /api/v1/system-admin/roles:
 *   post:
 *     summary: Tạo mới role
 *     tags: [System Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - group_id
 *               - name
 *             properties:
 *               group_id:
 *                 type: string
 *                 example: abc-123-def-456
 *               name:
 *                 type: string
 *                 example: manage_users
 *               description:
 *                 type: string
 *                 example: Quản lý người dùng
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
 *                   example: Create role successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/", rolesController.createRole);

/**
 * @swagger
 * /api/v1/system-admin/roles/{id}:
 *   put:
 *     summary: Cập nhật role
 *     tags: [System Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_id:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
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
 *                   example: Update role successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy role
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", rolesController.updateRole);

/**
 * @swagger
 * /api/v1/system-admin/roles/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn role
 *     tags: [System Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
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
 *                   example: Role deleted permanently
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy role
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", rolesController.deleteRole);

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def-456
 *         group_id:
 *           type: string
 *           example: group-abc-123
 *         name:
 *           type: string
 *           example: manage_users
 *         description:
 *           type: string
 *           example: Quản lý người dùng
 *         group:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             type:
 *               type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = router;
