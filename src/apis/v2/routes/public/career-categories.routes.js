const express = require("express");
const router = express.Router();
const careerCategoriesController = require("../../controllers/public/career-categories.controller");

/**
 * @swagger
 * tags:
 *   name: V2 - Public - Career Categories
 *   description: Public API cho danh sách nhóm nghề (Landing Page)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicCareerCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def
 *         name:
 *           type: string
 *           example: Công nghệ thông tin
 */

/**
 * @swagger
 * /api/v2/public/career-categories:
 *   get:
 *     summary: Lấy tất cả danh sách nhóm nghề (không phân trang)
 *     tags: [V2 - Public - Career Categories]
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
 *                   example: Get all career categories successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicCareerCategory'
 *       500:
 *         description: Lỗi server
 */
router.get("/", careerCategoriesController.getAllCareerCategories);

module.exports = router;
