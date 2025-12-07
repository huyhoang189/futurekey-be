const express = require("express");
const router = express.Router();
const questionCategoriesController = require("../../controllers/question-manage/questionCategories.controller");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: V1 - Question Categories
 *   description: API quản lý danh mục câu hỏi (không phân cấp)
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
 *           example: I. Câu hỏi tự luận cá nhân (Khám phá nhận thức & giá trị)
 *         description:
 *           type: string
 *           example: Các câu hỏi giúp học sinh tự luận, khám phá và nhận thức về bản thân
 *         order_index:
 *           type: integer
 *           example: 1
 *         created_by:
 *           type: string
 *           example: user-123-abc
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/question-manage/question-categories:
 *   get:
 *     summary: Lấy danh sách danh mục câu hỏi
 *     description: |
 *       Lấy tất cả question categories với pagination.
 *       
 *       **Lưu ý:**
 *       - Danh mục KHÔNG phân cấp (flat structure)
 *       - order_index xác định thứ tự hiển thị trong đề thi
 *       - VD: I. Câu hỏi tự luận → II. Khai thác sở thích → III. Định hướng nghề nghiệp
 *     tags: [V1 - Question Categories]
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
 *         description: Tìm kiếm theo tên danh mục
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
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get("/", checkAuth, questionCategoriesController.getAllCategories);

/**
 * @swagger
 * /api/v1/question-manage/question-categories/{id}:
 *   get:
 *     summary: Lấy chi tiết danh mục theo ID
 *     tags: [V1 - Question Categories]
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
router.get("/:id", checkAuth, questionCategoriesController.getCategoryById);

/**
 * @swagger
 * /api/v1/question-manage/question-categories:
 *   post:
 *     summary: Tạo danh mục câu hỏi mới
 *     description: |
 *       Tạo danh mục để phân loại câu hỏi theo phần trong đề thi.
 *       
 *       **Ví dụ danh mục:**
 *       - I. Câu hỏi tự luận cá nhân (order_index: 1)
 *       - II. Khai thác sở thích – giá trị cá nhân (order_index: 2)
 *       - III. Câu hỏi định hướng nghề nghiệp (order_index: 3)
 *     tags: [V1 - Question Categories]
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
 *                 example: I. Câu hỏi tự luận cá nhân (Khám phá nhận thức & giá trị)
 *               description:
 *                 type: string
 *                 example: Các câu hỏi giúp học sinh tự luận, khám phá và nhận thức về bản thân, giá trị cá nhân
 *               order_index:
 *                 type: integer
 *                 example: 1
 *                 description: Thứ tự hiển thị trong đề thi
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
router.post("/", checkAuth, questionCategoriesController.createCategory);

/**
 * @swagger
 * /api/v1/question-manage/question-categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục câu hỏi
 *     tags: [V1 - Question Categories]
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
 *                 example: I. Câu hỏi tự luận cá nhân (Khám phá nhận thức & giá trị) - Updated
 *               description:
 *                 type: string
 *               order_index:
 *                 type: integer
 *                 example: 2
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
router.put("/:id", checkAuth, questionCategoriesController.updateCategory);

/**
 * @swagger
 * /api/v1/question-manage/question-categories/{id}:
 *   delete:
 *     summary: Xóa danh mục câu hỏi
 *     description: |
 *       Xóa danh mục (chỉ nếu chưa có câu hỏi hoặc cấu hình đề thi sử dụng).
 *       
 *       **KHÔNG xóa được nếu:**
 *       - Có câu hỏi thuộc danh mục này (questions.category_id)
 *       - Có cấu hình đề thi sử dụng (exam_config_distributions.category_id)
 *     tags: [V1 - Question Categories]
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
router.delete("/:id", checkAuth, questionCategoriesController.deleteCategory);

module.exports = router;
