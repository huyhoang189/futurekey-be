const express = require("express");
const router = express.Router();
const provincesController = require("../../controllers/system-admin/provinces.controller");

/**
 * @swagger
 * tags:
 *   name: System Admin - Provinces
 *   description: API quản lý tỉnh/thành phố
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Province:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def
 *         name:
 *           type: string
 *           example: TP. Hồ Chí Minh
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/system-admin/provinces:
 *   get:
 *     summary: Lấy danh sách provinces
 *     tags: [System Admin - Provinces]
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
 *         description: Tìm kiếm theo tên tỉnh/thành phố
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Lọc theo tên tỉnh/thành phố
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
 *                   example: Get all provinces successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Province'
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
router.get("/", provincesController.getAllProvinces);

/**
 * @swagger
 * /api/v1/system-admin/provinces/{id}:
 *   get:
 *     summary: Lấy thông tin province theo ID
 *     tags: [System Admin - Provinces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Province ID
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
 *                   example: Get province successfully
 *                 data:
 *                   $ref: '#/components/schemas/Province'
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", provincesController.getProvinceById);

/**
 * @swagger
 * /api/v1/system-admin/provinces:
 *   post:
 *     summary: Tạo mới province
 *     tags: [System Admin - Provinces]
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
 *                 example: TP. Hồ Chí Minh
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
 *                   example: Create province successfully
 *                 data:
 *                   $ref: '#/components/schemas/Province'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/", provincesController.createProvince);

/**
 * @swagger
 * /api/v1/system-admin/provinces/{id}:
 *   put:
 *     summary: Cập nhật province
 *     tags: [System Admin - Provinces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Province ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Thành phố Hồ Chí Minh
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
 *                   example: Update province successfully
 *                 data:
 *                   $ref: '#/components/schemas/Province'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", provincesController.updateProvince);

/**
 * @swagger
 * /api/v1/system-admin/provinces/{id}:
 *   delete:
 *     summary: Xóa province
 *     tags: [System Admin - Provinces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Province ID
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
 *                   example: Delete province successfully
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", provincesController.deleteProvince);

/**
 * @swagger
 * /api/v1/system-admin/provinces/{id}/communes:
 *   get:
 *     summary: Lấy danh sách communes của province
 *     tags: [System Admin - Provinces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Province ID
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
 *                   example: Get province communes successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: commune-123-def
 *                       name:
 *                         type: string
 *                         example: Xã Tân Phú
 *                       province_id:
 *                         type: string
 *                         example: province-123-def
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     skip:
 *                       type: integer
 *                       example: 0
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     page:
 *                       type: integer
 *                       example: 1
 *       404:
 *         description: Không tìm thấy province
 *       500:
 *         description: Lỗi server
 */
router.get("/:id/communes", provincesController.getProvinceCommunes);

module.exports = router;