const express = require("express");
const router = express.Router();
const communesController = require("../../controllers/category/communes.controller");

/**
 * @swagger
 * tags:
 *   name: Category - Communes
 *   description: API quản lý xã/phường
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Commune:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def
 *         name:
 *           type: string
 *           example: Xã Tân Phú
 *         province_id:
 *           type: string
 *           example: province-123-def
 *         province:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: province-123-def
 *             name:
 *               type: string
 *               example: TP. Hồ Chí Minh
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/category/communes:
 *   get:
 *     summary: Lấy danh sách communes
 *     tags: [Category - Communes]
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
 *         description: Tìm kiếm theo tên xã/phường
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Lọc theo tên xã/phường
 *       - in: query
 *         name: province_id
 *         schema:
 *           type: string
 *         description: Lọc theo tỉnh/thành phố
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
 *                   example: Get all communes successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Commune'
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
router.get("/", communesController.getAllCommunes);

/**
 * @swagger
 * /api/v1/category/communes/{id}:
 *   get:
 *     summary: Lấy thông tin commune theo ID
 *     tags: [Category - Communes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commune ID
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
 *                   example: Get commune successfully
 *                 data:
 *                   $ref: '#/components/schemas/Commune'
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", communesController.getCommuneById);

/**
 * @swagger
 * /api/v1/category/communes:
 *   post:
 *     summary: Tạo mới commune
 *     tags: [Category - Communes]
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
 *                 example: Xã Tân Phú
 *               province_id:
 *                 type: string
 *                 example: province-123-def
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
 *                   example: Create commune successfully
 *                 data:
 *                   $ref: '#/components/schemas/Commune'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/", communesController.createCommune);

/**
 * @swagger
 * /api/v1/category/communes/{id}:
 *   put:
 *     summary: Cập nhật commune
 *     tags: [Category - Communes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commune ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Xã Tân Phú Đông
 *               province_id:
 *                 type: string
 *                 example: province-456-xyz
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
 *                   example: Update commune successfully
 *                 data:
 *                   $ref: '#/components/schemas/Commune'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", communesController.updateCommune);

/**
 * @swagger
 * /api/v1/category/communes/{id}:
 *   delete:
 *     summary: Xóa commune
 *     tags: [Category - Communes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commune ID
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
 *                   example: Delete commune successfully
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", communesController.deleteCommune);

module.exports = router;
