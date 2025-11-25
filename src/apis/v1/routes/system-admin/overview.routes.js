const express = require("express");
const router = express.Router();
const overviewController = require("../../controllers/system-admin/overview.controller");

/**
 * @swagger
 * tags:
 *   name: System Admin - Overview
 *   description: API thống kê tổng quan hệ thống
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemStats:
 *       type: object
 *       properties:
 *         totalSchools:
 *           type: integer
 *           example: 120
 *         totalStudents:
 *           type: integer
 *           example: 16240
 *         totalUsers:
 *           type: integer
 *           example: 20300
 *         totalTeachers:
 *           type: integer
 *           example: 1800
 *         totalClasses:
 *           type: integer
 *           example: 540
 *         totalCareers:
 *           type: integer
 *           example: 42
 *         totalCriteria:
 *           type: integer
 *           example: 214
 *         totalOrders:
 *           type: integer
 *           example: 320
 *         activeLicenses:
 *           type: integer
 *           example: 88
 *         storage:
 *           type: object
 *           properties:
 *             totalFiles:
 *               type: integer
 *               example: 5400
 *             totalSizeBytes:
 *               type: integer
 *               example: 12800000000
 *
 *     OrdersStatusStats:
 *       type: object
 *       properties:
 *         PENDING:
 *           type: integer
 *           example: 45
 *         APPROVED:
 *           type: integer
 *           example: 230
 *         REJECTED:
 *           type: integer
 *           example: 12
 *
 *     TopPurchasedCareer:
 *       type: object
 *       properties:
 *         careerId:
 *           type: string
 *           example: c1
 *         careerName:
 *           type: string
 *           example: Công nghệ thông tin
 *         purchased:
 *           type: integer
 *           example: 120
 *
 *     LicensesStatusStats:
 *       type: object
 *       properties:
 *         ACTIVE:
 *           type: integer
 *           example: 88
 *         EXPIRED:
 *           type: integer
 *           example: 42
 *         PENDING_ACTIVATION:
 *           type: integer
 *           example: 10
 *         REVOKED:
 *           type: integer
 *           example: 3
 *
 *     ExpiringLicense:
 *       type: object
 *       properties:
 *         school:
 *           type: string
 *           example: THPT Hà Nội
 *         career:
 *           type: string
 *           example: Marketing
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           example: 2025-03-12T00:00:00.000Z
 */

/**
 * @swagger
 * /api/v1/system-admin/overview/stats:
 *   get:
 *     summary: Lấy tổng quan hệ thống
 *     tags: [System Admin - Overview]
 *     security:
 *       - bearerAuth: []
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
 *                   example: Get system stats successfully
 *                 data:
 *                   $ref: '#/components/schemas/SystemStats'
 *       500:
 *         description: Lỗi server
 */
router.get("/stats", overviewController.getSystemStats);

/**
 * @swagger
 * /api/v1/system-admin/overview/orders/status:
 *   get:
 *     summary: Lấy thống kê trạng thái đơn hàng
 *     tags: [System Admin - Overview]
 *     security:
 *       - bearerAuth: []
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
 *                   example: Get orders status stats successfully
 *                 data:
 *                   $ref: '#/components/schemas/OrdersStatusStats'
 *       500:
 *         description: Lỗi server
 */
router.get("/orders/status", overviewController.getOrdersStatusStats);

/**
 * @swagger
 * /api/v1/system-admin/overview/careers/top-purchased:
 *   get:
 *     summary: Lấy danh sách ngành nghề được mua nhiều nhất
 *     tags: [System Admin - Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng ngành nghề muốn lấy
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
 *                   example: Get top purchased careers successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TopPurchasedCareer'
 *       400:
 *         description: Tham số không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.get("/careers/top-purchased", overviewController.getTopPurchasedCareers);

/**
 * @swagger
 * /api/v1/system-admin/overview/licenses/status:
 *   get:
 *     summary: Lấy thống kê license theo trạng thái
 *     tags: [System Admin - Overview]
 *     security:
 *       - bearerAuth: []
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
 *                   example: Get licenses status stats successfully
 *                 data:
 *                   $ref: '#/components/schemas/LicensesStatusStats'
 *       500:
 *         description: Lỗi server
 */
router.get("/licenses/status", overviewController.getLicensesStatusStats);

/**
 * @swagger
 * /api/v1/system-admin/overview/licenses/expiring:
 *   get:
 *     summary: Lấy danh sách license sắp hết hạn
 *     tags: [System Admin - Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Số ngày tính từ hôm nay
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
 *                   example: Get expiring licenses successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExpiringLicense'
 *       400:
 *         description: Tham số không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.get("/licenses/expiring", overviewController.getExpiringLicenses);

module.exports = router;
