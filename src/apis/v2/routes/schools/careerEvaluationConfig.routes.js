const express = require("express");
const router = express.Router();
const careerEvaluationConfigController = require("../../controllers/schools/careerEvaluationConfig.controller");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Career Evaluation Config
 *   description: API cấu hình đánh giá nghề nghiệp (trọng số, ngưỡng, thống kê)
 */

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/weights:
 *   post:
 *     summary: Cấu hình trọng số tiêu chí cho lớp và nghề nghiệp
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - weights
 *             properties:
 *               class_id:
 *                 type: string
 *                 description: ID của lớp học
 *               career_id:
 *                 type: string
 *                 description: ID của nghề nghiệp
 *               weights:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - criteria_id
 *                     - weight
 *                   properties:
 *                     criteria_id:
 *                       type: string
 *                       description: ID tiêu chí
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       description: Trọng số (%) - tổng phải = 100
 *     responses:
 *       200:
 *         description: Cấu hình thành công
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
 *                     message:
 *                       type: string
 *                     total_weight:
 *                       type: number
 *                     criteria_count:
 *                       type: integer
 *       400:
 *         description: Dữ liệu không hợp lệ (tổng weight ≠ 100)
 *       500:
 *         description: Lỗi server
 */
router.post("/weights", careerEvaluationConfigController.configureCriteriaWeights);

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/weights:
 *   get:
 *     summary: Lấy cấu hình trọng số tiêu chí
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *       - in: query
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề nghiệp
 *     responses:
 *       200:
 *         description: Danh sách trọng số
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
 *                     class_id:
 *                       type: string
 *                     career_id:
 *                       type: string
 *                     weights:
 *                       type: array
 *                     total_weight:
 *                       type: number
 *                     is_valid:
 *                       type: boolean
 *       400:
 *         description: Thiếu tham số
 *       500:
 *         description: Lỗi server
 */
router.get("/weights", careerEvaluationConfigController.getCriteriaWeights);

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/thresholds:
 *   post:
 *     summary: Cấu hình ngưỡng đánh giá
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - very_suitable_min
 *               - suitable_min
 *             properties:
 *               class_id:
 *                 type: string
 *                 description: ID của lớp học
 *               career_id:
 *                 type: string
 *                 description: ID của nghề nghiệp
 *               very_suitable_min:
 *                 type: number
 *                 description: Ngưỡng tối thiểu cho "Rất phù hợp"
 *               suitable_min:
 *                 type: number
 *                 description: Ngưỡng tối thiểu cho "Phù hợp"
 *     responses:
 *       200:
 *         description: Cấu hình thành công
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
 *                     class_id:
 *                       type: string
 *                     career_id:
 *                       type: string
 *                     max_score:
 *                       type: number
 *                     very_suitable_min:
 *                       type: number
 *                     suitable_min:
 *                       type: number
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/thresholds", careerEvaluationConfigController.configureEvaluationThresholds);

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/thresholds:
 *   get:
 *     summary: Lấy cấu hình ngưỡng đánh giá
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *       - in: query
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề nghiệp
 *     responses:
 *       200:
 *         description: Thông tin ngưỡng đánh giá
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
 *                     class_id:
 *                       type: string
 *                     career_id:
 *                       type: string
 *                     max_score:
 *                       type: number
 *                     very_suitable_min:
 *                       type: number
 *                     suitable_min:
 *                       type: number
 *       400:
 *         description: Thiếu tham số
 *       500:
 *         description: Lỗi server
 */
router.get("/thresholds", careerEvaluationConfigController.getEvaluationThresholds);

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/statistics:
 *   get:
 *     summary: Thống kê kết quả đánh giá của lớp
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *       - in: query
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề nghiệp
 *     responses:
 *       200:
 *         description: Thống kê kết quả
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
 *                     class_id:
 *                       type: string
 *                     career_id:
 *                       type: string
 *                     total_evaluations:
 *                       type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         very_suitable:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: integer
 *                             percentage:
 *                               type: string
 *                         suitable:
 *                           type: object
 *                         not_suitable:
 *                           type: object
 *                     average_score:
 *                       type: string
 *                     average_percentage:
 *                       type: string
 *       400:
 *         description: Thiếu tham số
 *       500:
 *         description: Lỗi server
 */
router.get("/statistics", careerEvaluationConfigController.getEvaluationStatistics);

module.exports = router;
