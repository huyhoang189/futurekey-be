const express = require("express");
const router = express.Router();
const careersController = require("../../controllers/public/careers.controller");

/**
 * @swagger
 * tags:
 *   name: V2 - Public - Careers
 *   description: Public API cho danh sách nghề (Landing Page)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicCareer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def
 *         code:
 *           type: string
 *           example: IT001
 *         name:
 *           type: string
 *           example: Lập trình viên
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: cat-123
 *               name:
 *                 type: string
 *                 example: Công nghệ thông tin
 *         criteria_count:
 *           type: integer
 *           example: 5
 *         image_url:
 *           type: string
 *           nullable: true
 *           example: https://example.com/image.jpg
 */

/**
 * @swagger
 * /api/v2/public/careers:
 *   get:
 *     summary: Lấy danh sách nghề (có phân trang, tìm kiếm, lọc theo nhóm nghề)
 *     tags: [V2 - Public - Careers]
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
 *         description: Số lượng items mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mã nghề
 *       - in: query
 *         name: category_ids
 *         schema:
 *           type: string
 *         description: Danh sách ID nhóm nghề (phân cách bằng dấu phẩy), ví dụ "id1,id2,id3"
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
 *                   example: Get all careers successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicCareer'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     skip:
 *                       type: integer
 *                       example: 0
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     page:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Lỗi server
 */
router.get("/", careersController.getAllCareers);

module.exports = router;
