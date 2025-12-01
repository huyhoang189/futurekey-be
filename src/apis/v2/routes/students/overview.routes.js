const express = require("express");
const router = express.Router();
const overviewController = require("../../controllers/students/overview.controller");

/**
 * @swagger
 * tags:
 *   name: V2 - Student Overview
 *   description: Endpoints thống kê tổng quan cho học sinh
 */

/**
 * @swagger
 * /api/v2/students/overview/careers:
 *   get:
 *     summary: Thống kê tổng quan về nghề nghiệp và tiêu chí học tập
 *     tags: [V2 - Student Overview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê thành công
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
 *                   example: Get career overview statistics successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_criteria:
 *                       type: integer
 *                       description: Tổng số tiêu chí cần học
 *                       example: 50
 *                     total_careers:
 *                       type: integer
 *                       description: Tổng số nghề đã cấu hình
 *                       example: 5
 *                     completed_criteria:
 *                       type: integer
 *                       description: Số tiêu chí đã hoàn thành
 *                       example: 30
 *                     completed_careers:
 *                       type: integer
 *                       description: Số nghề đã hoàn thành
 *                       example: 2
 *       401:
 *         description: Chưa xác thực
 *       400:
 *         description: Thiếu thông tin class_id
 */
router.get("/careers", overviewController.getCareersOverview);

/**
 * @swagger
 * /api/v2/students/overview/careers/list:
 *   get:
 *     summary: Lấy danh sách nghề đang học với tiến độ hoàn thành
 *     tags: [V2 - Student Overview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                   example: Get careers in progress successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "abc-123"
 *                       code:
 *                         type: string
 *                         example: "IT001"
 *                       name:
 *                         type: string
 *                         example: "Lập trình viên"
 *                       description:
 *                         type: string
 *                         example: "Mô tả nghề lập trình viên"
 *                       total_criteria:
 *                         type: integer
 *                         example: 10
 *                       completed_criteria:
 *                         type: integer
 *                         example: 7
 *                       progress_percent:
 *                         type: number
 *                         format: float
 *                         example: 70.00
 *                       is_completed:
 *                         type: boolean
 *                         example: false
 *       401:
 *         description: Chưa xác thực
 *       400:
 *         description: Thiếu thông tin class_id
 */
router.get("/careers/list", overviewController.getCareersInProgress);

/**
 * @swagger
 * /api/v2/students/overview/weekly:
 *   get:
 *     summary: Thống kê số tiêu chí học được theo tuần
 *     tags: [V2 - Student Overview]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: time_range
 *         schema:
 *           type: string
 *           enum: [1month, 3months, 6months]
 *           default: 1month
 *         description: Khoảng thời gian thống kê (1 tháng, 3 tháng, hoặc 6 tháng)
 *     responses:
 *       200:
 *         description: Thống kê thành công
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
 *                   example: Get weekly learning statistics successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       week:
 *                         type: string
 *                         example: "2025-W48"
 *                       year:
 *                         type: integer
 *                         example: 2025
 *                       week_number:
 *                         type: integer
 *                         example: 48
 *                       week_start:
 *                         type: string
 *                         format: date
 *                         example: "2025-11-24"
 *                       week_end:
 *                         type: string
 *                         format: date
 *                         example: "2025-11-30"
 *                       completed_criteria_count:
 *                         type: integer
 *                         example: 5
 *       401:
 *         description: Chưa xác thực
 *       400:
 *         description: Thiếu thông tin class_id
 */
router.get("/weekly", overviewController.getWeeklyLearningStats);

module.exports = router;
