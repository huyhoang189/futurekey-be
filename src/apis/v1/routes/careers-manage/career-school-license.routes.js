const express = require("express");
const router = express.Router();

const careerSchoolLicenseController = require("../../controllers/careers-manage/career-school-license.controller");

/**
 * @swagger
 * tags:
 *   name: Careers Management - School Licenses
 *   description: API quản lý giấy phép nghề nghiệp của trường
 */

/**
 * @swagger
 * /api/v1/careers-manage/career-school-licenses:
 *   get:
 *     summary: Lấy danh sách licenses theo order_id
 *     tags: [Careers Management - School Licenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
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
 *           enum: [ACTIVE, EXPIRED, REVOKED, PENDING_ACTIVATION]
 *         description: Lọc theo trạng thái
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
 *                   example: Get licenses successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SchoolCareerLicense'
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
 *       400:
 *         description: Thiếu order_id
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
router.get("/", careerSchoolLicenseController.getLicensesByOrderId);

/**
 * @swagger
 * /api/v1/careers-manage/career-school-licenses/{id}/revoke:
 *   put:
 *     summary: Thu hồi license theo ID
 *     tags: [Careers Management - School Licenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: License ID
 *     responses:
 *       200:
 *         description: Thu hồi thành công
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
 *                   example: License revoked successfully
 *                 data:
 *                   $ref: '#/components/schemas/SchoolCareerLicense'
 *       400:
 *         description: License đã bị thu hồi
 *       404:
 *         description: Không tìm thấy license
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/revoke", careerSchoolLicenseController.revokeLicense);

/**
 * @swagger
 * /api/v1/careers-manage/career-school-licenses/{id}/renew:
 *   put:
 *     summary: Gia hạn license theo ID
 *     tags: [Careers Management - School Licenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: License ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expiry_date
 *             properties:
 *               expiry_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T23:59:59Z"
 *                 description: Ngày hết hạn mới (phải sau start_date)
 *     responses:
 *       200:
 *         description: Gia hạn thành công
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
 *                   example: License renewed successfully
 *                 data:
 *                   $ref: '#/components/schemas/SchoolCareerLicense'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không thể gia hạn
 *       404:
 *         description: Không tìm thấy license
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/renew", careerSchoolLicenseController.renewLicense);

/**
 * @swagger
 * /api/v1/careers-manage/career-school-licenses/{id}/activate:
 *   put:
 *     summary: Kích hoạt license theo ID
 *     description: Kích hoạt license nếu thời gian hiện tại nằm trong khoảng [start_date, expiry_date] của license
 *     tags: [Careers Management - School Licenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: License ID
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
 *                   example: License activated successfully
 *                 data:
 *                   $ref: '#/components/schemas/SchoolCareerLicense'
 *       400:
 *         description: |
 *           - License đã active hoặc bị revoked
 *           - Thời gian hiện tại chưa đến start_date
 *           - Thời gian hiện tại đã qua expiry_date
 *       404:
 *         description: Không tìm thấy license
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/activate", careerSchoolLicenseController.activateLicense);

/**
 * @swagger
 * components:
 *   schemas:
 *     SchoolCareerLicense:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: license-123-abc-456
 *           description: ID license
 *         school_id:
 *           type: string
 *           example: school-123-abc
 *           description: ID trường
 *         career_id:
 *           type: string
 *           example: career-123-abc
 *           description: ID nghề nghiệp
 *         order_id:
 *           type: string
 *           example: order-123-abc
 *           description: ID đơn hàng
 *         order_item_id:
 *           type: string
 *           example: item-123-abc
 *           description: ID order item
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Ngày bắt đầu
 *         expiry_date:
 *           type: string
 *           format: date-time
 *           description: Ngày hết hạn
 *         status:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, REVOKED, PENDING_ACTIVATION]
 *           example: ACTIVE
 *           description: Trạng thái license
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
 *         career:
 *           type: object
 *           description: Thông tin nghề nghiệp
 *           properties:
 *             id:
 *               type: string
 *             code:
 *               type: string
 *             name:
 *               type: string
 */

module.exports = router;
