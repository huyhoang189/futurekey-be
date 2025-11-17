const express = require("express");
const router = express.Router();

const careerOrderItemController = require("../../controllers/careers-manage/career-order-item.controller");

/**
 * @swagger
 * tags:
 *   name: Careers Management - Order Items
 *   description: API quản lý items trong đơn hàng nghề nghiệp
 */

/**
 * @swagger
 * /api/v1/careers-manage/career-order-items:
 *   get:
 *     summary: Lấy danh sách items của đơn hàng (order_id bắt buộc)
 *     tags: [Careers Management - Order Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng (BẮT BUỘC)
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
 *         name: career_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID nghề nghiệp
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Thiếu order_id
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.get("/", careerOrderItemController.getAllCareerOrderItems);

/**
 * @swagger
 * /api/v1/careers-manage/career-order-items/{id}:
 *   get:
 *     summary: Lấy item theo ID
 *     tags: [Careers Management - Order Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy item
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", careerOrderItemController.getCareerOrderItemById);

/**
 * @swagger
 * /api/v1/careers-manage/career-order-items:
 *   post:
 *     summary: Tạo mới item cho đơn hàng
 *     tags: [Careers Management - Order Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - career_id
 *               - price
 *             properties:
 *               order_id:
 *                 type: string
 *                 example: order-123-abc
 *                 description: ID của đơn hàng
 *               career_id:
 *                 type: string
 *                 example: career-123-abc
 *                 description: ID của nghề nghiệp
 *               price:
 *                 type: integer
 *                 example: 100000
 *                 description: Giá tiền (VND, >= 0)
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy order hoặc career
 *       409:
 *         description: Nghề đã tồn tại trong đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.post("/", careerOrderItemController.createCareerOrderItem);

/**
 * @swagger
 * /api/v1/careers-manage/career-order-items/{id}:
 *   put:
 *     summary: Cập nhật item
 *     tags: [Careers Management - Order Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               career_id:
 *                 type: string
 *                 example: career-456-def
 *                 description: ID nghề nghiệp mới
 *               price:
 *                 type: integer
 *                 example: 150000
 *                 description: Giá tiền mới (>= 0)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy item hoặc career
 *       409:
 *         description: Nghề mới đã tồn tại trong đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", careerOrderItemController.updateCareerOrderItem);

/**
 * @swagger
 * /api/v1/careers-manage/career-order-items/{id}:
 *   delete:
 *     summary: Xóa item
 *     tags: [Careers Management - Order Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy item
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", careerOrderItemController.deleteCareerOrderItem);

/**
 * @swagger
 * /api/v1/careers-manage/career-order-items/order/{order_id}:
 *   delete:
 *     summary: Xóa tất cả items của một đơn hàng
 *     tags: [Careers Management - Order Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.delete(
  "/order/:order_id",
  careerOrderItemController.deleteAllItemsByOrderId
);

/**
 * @swagger
 * components:
 *   schemas:
 *     CareerOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: item-123-abc-456
 *         order_id:
 *           type: string
 *           example: order-123-abc
 *         career_id:
 *           type: string
 *           example: career-123-abc
 *         price:
 *           type: integer
 *           example: 100000
 *           description: Giá tiền (VND)
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = router;
