const express = require("express");
const router = express.Router();
const statisticsController = require("../../controllers/system-admin/statistics.controller");

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: API thống kê
 */

/**
 * @swagger
 * /api/v1/system-admin/statistics/school-overview:
 *   get:
 *     summary: Lấy thống kê tổng quan cho trường
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: school_id
 *         required: false
 *         schema:
 *           type: string
 *         description: ID của trường học (không truyền sẽ lấy tất cả trường)
 *         example: "school-001"
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
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
 *                   example: "Get school overview successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     teacher_count:
 *                       type: integer
 *                       example: 25
 *                       description: Số lượng giáo viên
 *                     student_count:
 *                       type: integer
 *                       example: 450
 *                       description: Số lượng học sinh
 *                     class_count:
 *                       type: integer
 *                       example: 15
 *                       description: Số lượng lớp học
 *                     career_count:
 *                       type: integer
 *                       example: 0
 *                       description: Số lượng ngành nghề (sẽ cập nhật sau)
 *       500:
 *         description: Lỗi server
 */
router.get("/school-overview", statisticsController.getSchoolOverview);

/**
 * @swagger
 * /api/v1/system-admin/statistics/students-by-level:
 *   get:
 *     summary: Thống kê học sinh theo khối
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: school_id
 *         required: false
 *         schema:
 *           type: string
 *         description: ID của trường học (không truyền sẽ lấy tất cả trường)
 *         example: "school-001"
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
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
 *                   example: "Get students by level successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       grade_level:
 *                         type: integer
 *                         example: 10
 *                         description: Khối học (1-12)
 *                       student_count:
 *                         type: integer
 *                         example: 120
 *                         description: Số lượng học sinh trong khối
 *                   example:
 *                     - grade_level: 10
 *                       student_count: 120
 *                     - grade_level: 11
 *                       student_count: 115
 *                     - grade_level: 12
 *                       student_count: 110
 *       500:
 *         description: Lỗi server
 */
router.get("/students-by-level", statisticsController.getStudentsByLevel);

module.exports = router;
