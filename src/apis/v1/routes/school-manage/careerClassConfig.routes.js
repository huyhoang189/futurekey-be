const express = require("express");
const router = express.Router();
const careerClassConfigController = require("../../controllers/school-manage/careerClassConfig.controller");

/**
 * @swagger
 * tags:
 *   name: School - Class Criteria Config
 *   description: API quản lý cấu hình tiêu chí nghề cho lớp học
 */

/**
 * @swagger
 * /api/v1/school-manage/class-criteria-config:
 *   get:
 *     summary: Lấy danh sách criteria_id theo class_id và career_id
 *     description: Lấy danh sách các criteria_id của một lớp học cho một nghề cụ thể (không phân trang)
 *     tags: [School - Class Criteria Config]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học (bắt buộc)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề (bắt buộc)
 *         example: "650e8400-e29b-41d4-a716-446655440001"
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
 *                   example: Get class criteria config list successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["750e8400-e29b-41d4-a716-446655440002", "850e8400-e29b-41d4-a716-446655440003"]
 *                   description: Mảng các criteria_id
 *       400:
 *         description: Thiếu tham số bắt buộc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: class_id is required
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error message
 */
router.get("/", careerClassConfigController.getClassCriteriaConfigList);

/**
 * @swagger
 * /api/v1/school-manage/class-criteria-config:
 *   post:
 *     summary: Tạo mới bản ghi class_criteria_config
 *     description: Tạo mới một bản ghi cấu hình tiêu chí nghề cho lớp học
 *     tags: [School - Class Criteria Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - criteria_id
 *             properties:
 *               class_id:
 *                 type: string
 *                 description: ID của lớp học (bắt buộc)
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               career_id:
 *                 type: string
 *                 description: ID của nghề (bắt buộc)
 *                 example: "650e8400-e29b-41d4-a716-446655440001"
 *               criteria_id:
 *                 type: string
 *                 description: ID của tiêu chí (bắt buộc)
 *                 example: "750e8400-e29b-41d4-a716-446655440002"
 *     responses:
 *       201:
 *         description: Tạo bản ghi thành công
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
 *                   example: Create class criteria config successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "950e8400-e29b-41d4-a716-446655440004"
 *                       description: ID của bản ghi mới tạo
 *                     class_id:
 *                       type: string
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     career_id:
 *                       type: string
 *                       example: "650e8400-e29b-41d4-a716-446655440001"
 *                     criteria_id:
 *                       type: string
 *                       example: "750e8400-e29b-41d4-a716-446655440002"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-23T15:30:00Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-23T15:30:00Z"
 *       400:
 *         description: Thiếu tham số bắt buộc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: class_id is required
 *       409:
 *         description: Bản ghi đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Class criteria config already exists with these parameters
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error message
 */
router.post("/", careerClassConfigController.createClassCriteriaConfig);

/**
 * @swagger
 * /api/v1/school-manage/class-criteria-config:
 *   delete:
 *     summary: Xóa bản ghi class_criteria_config theo class_id, career_id, criteria_id
 *     description: Xóa một bản ghi cấu hình tiêu chí nghề cho lớp học theo 3 tham số
 *     tags: [School - Class Criteria Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - criteria_id
 *             properties:
 *               class_id:
 *                 type: string
 *                 description: ID của lớp học (bắt buộc)
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               career_id:
 *                 type: string
 *                 description: ID của nghề (bắt buộc)
 *                 example: "650e8400-e29b-41d4-a716-446655440001"
 *               criteria_id:
 *                 type: string
 *                 description: ID của tiêu chí (bắt buộc)
 *                 example: "750e8400-e29b-41d4-a716-446655440002"
 *     responses:
 *       200:
 *         description: Xóa bản ghi thành công
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
 *                   example: Class criteria config deleted successfully
 *       400:
 *         description: Thiếu tham số bắt buộc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: class_id is required
 *       404:
 *         description: Không tìm thấy bản ghi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Class criteria config not found
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error message
 */
router.delete("/", careerClassConfigController.deleteClassCriteriaConfig);

module.exports = router;
