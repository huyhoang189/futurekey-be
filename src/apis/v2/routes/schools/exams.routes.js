const express = require("express");
const router = express.Router();
const examsController = require("../../controllers/schools/exams.controller");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Exams
 *   description: API quản lý đề thi
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ExamDistribution:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: dist-123-abc
 *         category_id:
 *           type: string
 *           example: cat-123-abc
 *         easy_count:
 *           type: integer
 *           example: 5
 *         medium_count:
 *           type: integer
 *           example: 3
 *         hard_count:
 *           type: integer
 *           example: 2
 *         order_index:
 *           type: integer
 *           example: 1
 *     Exam:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: exam-123-abc
 *         exam_code:
 *           type: string
 *           example: EXAM-2024-001
 *         title:
 *           type: string
 *           example: Đề thi giữa kỳ Toán học
 *         description:
 *           type: string
 *           example: Đề thi giữa kỳ môn Toán
 *         exam_type:
 *           type: string
 *           enum: [PRACTICE, QUIZ, MIDTERM, FINAL, MOCK_TEST]
 *           example: MIDTERM
 *         duration_minutes:
 *           type: integer
 *           example: 60
 *         passing_score:
 *           type: number
 *           example: 50
 *         total_score:
 *           type: number
 *           example: 100
 *         shuffle_questions:
 *           type: boolean
 *           example: true
 *         shuffle_options:
 *           type: boolean
 *           example: true
 *         show_results_immediately:
 *           type: boolean
 *           example: false
 *         start_time:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T08:00:00Z
 *         end_time:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:00:00Z
 *         max_attempts:
 *           type: integer
 *           example: 2
 *         is_published:
 *           type: boolean
 *           example: true
 *         created_by:
 *           type: string
 *           example: user-123-abc
 *         is_active:
 *           type: boolean
 *           example: true
 *         distributions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ExamDistribution'
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v2/schools/exams:
 *   get:
 *     summary: Lấy danh sách đề thi
 *     tags: [V2 - Schools - Exams]
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
 *         description: Tìm kiếm theo tiêu đề hoặc mã đề
 *       - in: query
 *         name: exam_type
 *         schema:
 *           type: string
 *           enum: [PRACTICE, QUIZ, MIDTERM, FINAL, MOCK_TEST]
 *         description: Lọc theo loại đề thi
 *       - in: query
 *         name: is_published
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái công bố
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
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
 *                     $ref: '#/components/schemas/Exam'
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
router.get("/", checkAuth, examsController.getAllExams);

/**
 * @swagger
 * /api/v2/schools/exams/{id}:
 *   get:
 *     summary: Lấy đề thi theo ID
 *     tags: [V2 - Schools - Exams]
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
 *                   $ref: '#/components/schemas/Exam'
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", checkAuth, examsController.getExamById);

/**
 * @swagger
 * /api/v2/schools/exams:
 *   post:
 *     summary: Tạo đề thi mới
 *     tags: [V2 - Schools - Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - exam_type
 *               - duration_minutes
 *               - total_score
 *             properties:
 *               exam_code:
 *                 type: string
 *                 example: EXAM-2024-002
 *               title:
 *                 type: string
 *                 example: Đề thi cuối kỳ Toán học
 *               description:
 *                 type: string
 *                 example: Đề thi cuối kỳ 1 môn Toán lớp 10
 *               exam_type:
 *                 type: string
 *                 enum: [PRACTICE, QUIZ, MIDTERM, FINAL, MOCK_TEST]
 *                 example: FINAL
 *               duration_minutes:
 *                 type: integer
 *                 example: 90
 *               passing_score:
 *                 type: number
 *                 example: 60
 *               total_score:
 *                 type: number
 *                 example: 100
 *               shuffle_questions:
 *                 type: boolean
 *                 example: true
 *               shuffle_options:
 *                 type: boolean
 *                 example: true
 *               show_results_immediately:
 *                 type: boolean
 *                 example: false
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-06-15T08:00:00Z
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-06-15T10:30:00Z
 *               max_attempts:
 *                 type: integer
 *                 example: 1
 *               is_published:
 *                 type: boolean
 *                 example: false
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
 *                   $ref: '#/components/schemas/Exam'
 */
router.post("/", checkAuth, examsController.createExam);

/**
 * @swagger
 * /api/v2/schools/exams/{id}:
 *   put:
 *     summary: Cập nhật đề thi
 *     tags: [V2 - Schools - Exams]
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
 *               exam_code:
 *                 type: string
 *                 example: EXAM-2024-002-UPDATED
 *               title:
 *                 type: string
 *                 example: Đề thi cuối kỳ Toán học (Cập nhật)
 *               description:
 *                 type: string
 *                 example: Đề thi cuối kỳ 1 môn Toán lớp 10 - Phiên bản mới
 *               exam_type:
 *                 type: string
 *                 enum: [PRACTICE, QUIZ, MIDTERM, FINAL, MOCK_TEST]
 *                 example: FINAL
 *               duration_minutes:
 *                 type: integer
 *                 example: 120
 *               passing_score:
 *                 type: number
 *                 example: 70
 *               total_score:
 *                 type: number
 *                 example: 120
 *               shuffle_questions:
 *                 type: boolean
 *                 example: false
 *               shuffle_options:
 *                 type: boolean
 *                 example: false
 *               show_results_immediately:
 *                 type: boolean
 *                 example: true
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-06-20T08:00:00Z
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-06-20T11:00:00Z
 *               max_attempts:
 *                 type: integer
 *                 example: 3
 *               is_published:
 *                 type: boolean
 *                 example: true
 *               is_active:
 *                 type: boolean
 *                 example: true
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
 *                   $ref: '#/components/schemas/Exam'
 */
router.put("/:id", checkAuth, examsController.updateExam);

/**
 * @swagger
 * /api/v2/schools/exams/{id}:
 *   delete:
 *     summary: Xóa đề thi
 *     tags: [V2 - Schools - Exams]
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
 *                   example: Exam deleted successfully
 *       400:
 *         description: Không thể xóa (có sinh viên đã thi)
 */
router.delete("/:id", checkAuth, examsController.deleteExam);

/**
 * @swagger
 * /api/v2/schools/exams/{id}/distributions:
 *   put:
 *     summary: Cập nhật phân bổ câu hỏi cho đề thi
 *     tags: [V2 - Schools - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đề thi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - distributions
 *             properties:
 *               distributions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - category_id
 *                     - easy_count
 *                     - medium_count
 *                     - hard_count
 *                   properties:
 *                     category_id:
 *                       type: string
 *                       example: cat-hinhoc-123
 *                     easy_count:
 *                       type: integer
 *                       example: 5
 *                     medium_count:
 *                       type: integer
 *                       example: 3
 *                     hard_count:
 *                       type: integer
 *                       example: 2
 *                     order_index:
 *                       type: integer
 *                       example: 1
 *                 example:
 *                   - category_id: "cat-hinhoc-123"
 *                     easy_count: 5
 *                     medium_count: 3
 *                     hard_count: 2
 *                     order_index: 1
 *                   - category_id: "cat-daisoc-456"
 *                     easy_count: 4
 *                     medium_count: 4
 *                     hard_count: 2
 *                     order_index: 2
 *     responses:
 *       200:
 *         description: Cập nhật phân bổ thành công
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
 *                     $ref: '#/components/schemas/ExamDistribution'
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.put("/:id/distributions", checkAuth, examsController.updateExamDistributions);

/**
 * @swagger
 * /api/v2/schools/exams/{id}/generate-questions:
 *   post:
 *     summary: Tạo câu hỏi ngẫu nhiên cho đề thi theo phân bổ
 *     tags: [V2 - Schools - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đề thi
 *     responses:
 *       200:
 *         description: Tạo câu hỏi thành công
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
 *                   example: Exam questions generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     exam_id:
 *                       type: string
 *                       example: exam-123-abc
 *                     total_questions:
 *                       type: integer
 *                       example: 20
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category_id:
 *                             type: string
 *                             example: cat-hinhoc-123
 *                           easy:
 *                             type: integer
 *                             example: 5
 *                           medium:
 *                             type: integer
 *                             example: 3
 *                           hard:
 *                             type: integer
 *                             example: 2
 *       400:
 *         description: Chưa có phân bổ hoặc không đủ câu hỏi
 */
router.post("/:id/generate-questions", checkAuth, examsController.generateExamQuestions);

module.exports = router;


