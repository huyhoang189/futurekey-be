const express = require("express");
const router = express.Router();
const groupsController = require("../../controllers/system-admin/groups.controller");

/**
 * @swagger
 * tags:
 *   name: System Admin - Groups
 *   description: API quản lý nhóm quyền
 */

/**
 * @swagger
 * /api/v1/system-admin/groups:
 *   get:
 *     summary: Lấy danh sách groups
 *     tags: [System Admin - Groups]
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
 *         name: type
 *         schema:
 *           type: string
 *         description: Lọc theo loại group
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
 *                   example: Get all groups successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
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
router.get("/", groupsController.getAllGroups);

/**
 * @swagger
 * /api/v1/system-admin/groups/{id}:
 *   get:
 *     summary: Lấy thông tin group theo ID
 *     tags: [System Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *                   example: Get group successfully
 *                 data:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy group
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", groupsController.getGroupById);

/**
 * @swagger
 * /api/v1/system-admin/groups:
 *   post:
 *     summary: Tạo mới group
 *     tags: [System Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin
 *               description:
 *                 type: string
 *                 example: Quản trị viên hệ thống
 *               type:
 *                 type: string
 *                 example: system
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
 *                   example: Create group successfully
 *                 data:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/", groupsController.createGroup);

/**
 * @swagger
 * /api/v1/system-admin/groups/{id}:
 *   put:
 *     summary: Cập nhật group
 *     tags: [System Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
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
 *                   example: Update group successfully
 *                 data:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy group
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", groupsController.updateGroup);

/**
 * @swagger
 * /api/v1/system-admin/groups/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn group
 *     tags: [System Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *                   example: Group deleted permanently
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy group
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", groupsController.deleteGroup);

/**
 * @swagger
 * /api/v1/system-admin/groups/{id}/roles:
 *   get:
 *     summary: Lấy danh sách roles của group
 *     tags: [System Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *                   example: Get group roles successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy group
 *       500:
 *         description: Lỗi server
 */
router.get("/:id/roles", groupsController.getGroupRoles);

/**
 * @swagger
 * /api/v1/system-admin/groups/{id}/users:
 *   get:
 *     summary: Lấy danh sách users trong group
 *     tags: [System Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *                   example: Get group users successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy group
 *       500:
 *         description: Lỗi server
 */
router.get("/:id/users", groupsController.getGroupUsers);

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def-456
 *         name:
 *           type: string
 *           example: Admin
 *         description:
 *           type: string
 *           example: Quản trị viên hệ thống
 *         type:
 *           type: string
 *           example: system
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         group_id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = router;
