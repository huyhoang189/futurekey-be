const express = require("express");
const router = express.Router();
const usersController = require("../../controllers/students/careers.controller");

/**
 * @swagger
 * tags:
 *   name: V2 - Student - Careers
 *   description: Endpoints dành cho học sinh dưới dạng public nhưng yêu cầu xác thực
 */

/**
 * @swagger
 * /api/v2/students/careers:
 *   get:
 *     summary: Danh sách nghề đã cấu hình theo lớp của học sinh đang đăng nhập
 *     tags: [V2 - Student - Careers]
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
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mã nghề
 *       - in: query
 *         name: category_ids
 *         schema:
 *           type: string
 *         description: Danh sách category_id phân tách bằng dấu phẩy để lọc theo nhóm nghề
 *     responses:
 *       200:
 *         description: Danh sách nghề và metadata phân trang
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
 *                     $ref: '#/components/schemas/StudentCareer'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get("/", usersController.getConfiguredCareersForStudent);

/**
 * @swagger
 * /api/v2/students/careers/{career_id}/criteria:
 *   get:
 *     summary: Lấy các tiêu chí đã cấu hình cho lớp theo career_id
 *     tags: [V2 - Student - Careers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Lọc theo tên hoặc mô tả tiêu chí
 *     responses:
 *       200:
 *         description: Danh sách tiêu chí được cấu hình
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
 *                     $ref: '#/components/schemas/CareerCriteriaWithCareer'
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
 */
router.get(
  "/:career_id/criteria",
  usersController.getConfiguredCriteriaForCareer
);

/**
 * @swagger
 * /api/v2/students/careers/criteria/{id}:
 *   get:
 *     summary: Lấy một tiêu chí nghề đã cấu hình theo ID
 *     tags: [V2 - Student - Careers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của criteria cần truy vấn
 *     responses:
 *       200:
 *         description: Trả về chi tiết tiêu chí nghề
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
 *                   $ref: '#/components/schemas/CareerCriteriaWithCareer'
 *       404:
 *         description: Không tìm thấy tiêu chí hoặc không được cấu hình
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
router.get("/criteria/:id", usersController.getCareerCriteriaById);

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentCareer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *         criteria_count:
 *           type: integer
 *         image_url:
 *           type: string
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         skip:
 *           type: integer
 *         limit:
 *           type: integer
 *         page:
 *           type: integer
 */

module.exports = router;
