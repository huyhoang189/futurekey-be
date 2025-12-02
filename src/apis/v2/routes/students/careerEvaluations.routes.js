const express = require("express");
const router = express.Router();
const careerEvaluationsController = require("../../controllers/students/careerEvaluations.controller");

/**
 * @swagger
 * tags:
 *   name: V2 - Students - Career Evaluations
 *   description: API đánh giá nghề nghiệp cho học sinh
 */

/**
 * @swagger
 * /api/v2/students/career-evaluations/submit:
 *   post:
 *     summary: Học sinh nộp bài đánh giá nghề nghiệp
 *     tags: [V2 - Students - Career Evaluations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - scores
 *             properties:
 *               class_id:
 *                 type: string
 *                 description: ID của lớp học
 *               career_id:
 *                 type: string
 *                 description: ID của nghề nghiệp
 *               scores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - criteria_id
 *                     - score
 *                   properties:
 *                     criteria_id:
 *                       type: string
 *                       description: ID tiêu chí
 *                     score:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 10
 *                       description: Điểm tự đánh giá (0-10)
 *     responses:
 *       201:
 *         description: Nộp bài đánh giá thành công
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
 *                     id:
 *                       type: string
 *                     weighted_score:
 *                       type: number
 *                     max_score:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     evaluation_result:
 *                       type: string
 *                       enum: [VERY_SUITABLE, SUITABLE, NOT_SUITABLE]
 *                     breakdown:
 *                       type: object
 *       400:
 *         description: Thiếu dữ liệu hoặc dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/submit", careerEvaluationsController.submitCareerEvaluation);

/**
 * @swagger
 * /api/v2/students/career-evaluations/results:
 *   get:
 *     summary: Xem kết quả đánh giá nghề nghiệp của học sinh
 *     tags: [V2 - Students - Career Evaluations]
 *     parameters:
 *       - in: query
 *         name: career_id
 *         schema:
 *           type: string
 *         description: Lọc theo nghề nghiệp (optional)
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *         description: Lọc theo lớp học (optional)
 *     responses:
 *       200:
 *         description: Danh sách kết quả đánh giá
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       student_id:
 *                         type: string
 *                       class_id:
 *                         type: string
 *                       career_id:
 *                         type: string
 *                       weighted_score:
 *                         type: number
 *                       max_score:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       evaluation_result:
 *                         type: string
 *                       evaluated_at:
 *                         type: string
 *                         format: date-time
 *                       detailed_scores:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             criteria_id:
 *                               type: string
 *                             raw_score:
 *                               type: number
 *                             weight:
 *                               type: number
 *                             weighted_score:
 *                               type: string
 *       500:
 *         description: Lỗi server
 */
router.get("/results", careerEvaluationsController.getMyEvaluationResults);

module.exports = router;
