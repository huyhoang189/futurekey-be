const express = require("express");
const router = express.Router();
const learningController = require("../../controllers/students/learning.controller");

/**
 * @swagger
 * /api/v2/students/learning:
 *   post:
 *     summary: Gửi trạng thái học tập của học sinh theo criteria
 *     tags: [V2 - Student - Learing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: "career_id,criteria_id,current_time,last_watched_position,status"
 *             example: "career-123,criteria-456,120,90,completed"
 *     responses:
 *       200:
 *         description: Payload đã được parse và xác thực
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     career_id:
 *                       type: string
 *                     criteria_id:
 *                       type: string
 *                     current_time:
 *                       type: string
 *                     last_watched_position:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Thiếu trường bắt buộc hoặc payload không đúng định dạng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post("/", learningController.learn);

module.exports = router;
