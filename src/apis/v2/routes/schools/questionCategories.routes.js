const express = require("express");
const router = express.Router();
const questionCategoriesController = require("../../controllers/schools/questionCategories.controller");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Question Categories
 *   description: API quản lý danh mục câu hỏi
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestionCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: cat-123-abc
 *         name:
 *           type: string
 *           example: Đại số
 *         description:
 *           type: string
 *           example: Danh mục câu hỏi về đại số
 *         parent_id:
 *           type: string
 *           example: cat-parent-123
 *         order_index:
 *           type: integer
 *           example: 1
 *         created_by:
 *           type: string
 *           example: user-123-abc
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v2/schools/question-categories:
 *   get:
 *     summary: Lấy danh sách danh mục câu hỏi
 *     tags: [V2 - Schools - Question Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Tìm kiếm theo tên
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuestionCategory'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     skip:
 *                       type: integer
 *                       example: 0
 *                     limit:
 *                       type: integer
 *                       example: 10
 */
router.get("/", checkAuth, questionCategoriesController.getAllQuestionCategories);

/**
 * @swagger
 * /api/v2/schools/question-categories/{id}:
 *   get:
 *     summary: Lấy danh mục câu hỏi theo ID
 *     tags: [V2 - Schools - Question Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 data:
 *                   $ref: '#/components/schemas/QuestionCategory'
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", checkAuth, questionCategoriesController.getQuestionCategoryById);

/**
 * @swagger
 * /api/v2/schools/question-categories:
 *   post:
 *     summary: Tạo danh mục câu hỏi mới
 *     tags: [V2 - Schools - Question Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hình học
 *               description:
 *                 type: string
 *                 example: Danh mục câu hỏi hình học
 *               parent_id:
 *                 type: string
 *                 example: cat-parent-123
 *               order_index:
 *                 type: integer
 *                 example: 2
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/QuestionCategory'
 */
router.post("/", checkAuth, questionCategoriesController.createQuestionCategory);

/**
 * @swagger
 * /api/v2/schools/question-categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục câu hỏi
 *     tags: [V2 - Schools - Question Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hình học không gian
 *               description:
 *                 type: string
 *                 example: Câu hỏi về hình học không gian
 *               parent_id:
 *                 type: string
 *                 example: cat-parent-456
 *               order_index:
 *                 type: integer
 *                 example: 3
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/QuestionCategory'
 */
router.put("/:id", checkAuth, questionCategoriesController.updateQuestionCategory);

/**
 * @swagger
 * /api/v2/schools/question-categories/{id}:
 *   delete:
 *     summary: Xóa danh mục câu hỏi
 *     tags: [V2 - Schools - Question Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
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
 *                   example: Question category deleted successfully
 *       400:
 *         description: Không thể xóa (đang được sử dụng)
 */
router.delete("/:id", checkAuth, questionCategoriesController.deleteQuestionCategory);

module.exports = router;

