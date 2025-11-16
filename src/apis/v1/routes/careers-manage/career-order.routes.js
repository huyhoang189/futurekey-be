const express = require("express");
const router = express.Router();

const careerOrderController = require("../../controllers/careers-manage/career-order.controller");

/**
 * @swagger
 * tags:
 *   name: Careers Management - Orders
 *   description: API quản lý đơn hàng nghề nghiệp
 */

/**
 * @swagger
 * /api/v1/careers-manage/career-orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng nghề nghiệp
 *     tags: [Careers Management - Orders]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get("/", careerOrderController.getAllCareerOrders);

/**
 * @swagger
 * /api/v1/careers-manage/career-orders/{id}:
 *   get:
 *     summary: Lấy đơn hàng theo ID
 *     tags: [Careers Management - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", careerOrderController.getCareerOrderById);

/**
 * @swagger
 * /api/v1/careers-manage/career-orders:
 *   post:
 *     summary: Tạo mới đơn hàng nghề nghiệp
 *     tags: [Careers Management - Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - school_id
 *               - career_ids
 *             properties:
 *               school_id:
 *                 type: string
 *                 example: school-123-abc
 *                 description: ID của trường
 *               career_ids:
 *                 type: array
 *                 description: Danh sách ID các nghề nghiệp (price mặc định = 0)
 *                 items:
 *                   type: string
 *                 example: ["career-123-abc", "career-456-def"]
 *               note:
 *                 type: string
 *                 example: Đơn hàng cho khối 12
 *                 description: Ghi chú đơn hàng
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
 *                   example: Create career order successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     school_id:
 *                       type: string
 *                     create_by:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: PENDING
 *                     note:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           order_id:
 *                             type: string
 *                           career_id:
 *                             type: string
 *                           price:
 *                             type: integer
 *                             example: 0
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy school hoặc career
 *       409:
 *         description: Career bị trùng lặp
 *       500:
 *         description: Lỗi server
 */
router.post("/", careerOrderController.createCareerOrder);

/**
 * @swagger
 * /api/v1/careers-manage/career-orders/{id}/review:
 *   put:
 *     summary: Duyệt hoặc từ chối đơn hàng
 *     tags: [Careers Management - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *                 example: APPROVED
 *                 description: Trạng thái duyệt
 *               note:
 *                 type: string
 *                 example: Đã kiểm tra và phê duyệt
 *                 description: Ghi chú khi duyệt
 *     responses:
 *       200:
 *         description: Duyệt thành công
 *       400:
 *         description: Không thể duyệt đơn hàng không phải PENDING
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/review", careerOrderController.reviewCareerOrder);

/**
 * @swagger
 * /api/v1/careers-manage/career-orders/{id}:
 *   delete:
 *     summary: Xóa đơn hàng (chỉ cho đơn hàng chưa duyệt)
 *     tags: [Careers Management - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Không thể xóa đơn hàng đã duyệt
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", careerOrderController.deleteCareerOrder);

/**
 * @swagger
 * components:
 *   schemas:
 *     CareerOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: order-123-abc-456
 *           description: ID đơn hàng
 *         school_id:
 *           type: string
 *           example: school-123-abc
 *           description: ID trường
 *         create_by:
 *           type: string
 *           example: user-123-abc
 *           description: ID người tạo
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           example: PENDING
 *           description: Trạng thái đơn hàng (mặc định PENDING khi tạo)
 *         note:
 *           type: string
 *           example: Đơn hàng cho khối 12
 *           description: Ghi chú
 *         reviewed_by:
 *           type: string
 *           example: admin-123-abc
 *           description: ID người duyệt
 *         reviewed_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian duyệt
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật
 *         school:
 *           type: object
 *           description: Thông tin trường
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             code:
 *               type: string
 *         creator:
 *           type: object
 *           description: Thông tin người tạo
 *           properties:
 *             id:
 *               type: string
 *             user_name:
 *               type: string
 *             full_name:
 *               type: string
 *             email:
 *               type: string
 *         reviewer:
 *           type: object
 *           description: Thông tin người duyệt
 *           properties:
 *             id:
 *               type: string
 *             user_name:
 *               type: string
 *             full_name:
 *               type: string
 *             email:
 *               type: string
 */

module.exports = router;
