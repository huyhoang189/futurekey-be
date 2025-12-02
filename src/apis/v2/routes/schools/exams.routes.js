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
 *         title:
 *           type: string
 *           example: Đề thi giữa kỳ Toán học
 *         description:
 *           type: string
 *           example: Đề thi giữa kỳ môn Toán
 *         class_id:
 *           type: string
 *           example: class-123-abc
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
 *         total_points:
 *           type: number
 *           example: 100
 *         is_shuffle_questions:
 *           type: boolean
 *           example: true
 *         is_shuffle_options:
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
 *               - class_id
 *               - exam_type
 *               - duration_minutes
 *               - total_points
 *             properties:
 *               title:
 *                 type: string
 *                 example: Kiểm tra Lập trình - Giữa kỳ 1
 *               description:
 *                 type: string
 *                 example: Đề thi giữa kỳ 1 môn Lập trình căn bản
 *               class_id:
 *                 type: string
 *                 description: ID lớp học (BẮT BUỘC)
 *                 example: class-uuid-here
 *               exam_type:
 *                 type: string
 *                 enum: [PRACTICE, QUIZ, MIDTERM, FINAL, MOCK_TEST]
 *                 example: MIDTERM
 *               duration_minutes:
 *                 type: integer
 *                 example: 90
 *               passing_score:
 *                 type: number
 *                 example: 5
 *               total_points:
 *                 type: number
 *                 example: 10
 *               instructions:
 *                 type: string
 *                 example: "- Làm bài trong 90 phút\n- Không được sử dụng tài liệu"
 *               is_shuffle_questions:
 *                 type: boolean
 *                 example: true
 *               is_shuffle_options:
 *                 type: boolean
 *                 example: true
 *               show_results_immediately:
 *                 type: boolean
 *                 example: false
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-10T08:00:00.000Z
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-15T17:00:00.000Z
 *               max_attempts:
 *                 type: integer
 *                 example: 1
 *               is_published:
 *                 type: boolean
 *                 example: false
 *               distributions:
 *                 type: array
 *                 description: Cấu hình random câu hỏi (QUAN TRỌNG)
 *                 items:
 *                   type: object
 *                   required:
 *                     - category_id
 *                     - quantity
 *                     - points_per_question
 *                     - order_index
 *                   properties:
 *                     category_id:
 *                       type: string
 *                       example: category-uuid-here
 *                     career_criteria_id:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     question_type:
 *                       type: string
 *                       enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY]
 *                       example: MULTIPLE_CHOICE
 *                     difficulty_level:
 *                       type: string
 *                       enum: [EASY, MEDIUM, HARD]
 *                       nullable: true
 *                       example: null
 *                     quantity:
 *                       type: integer
 *                       example: 15
 *                     easy_count:
 *                       type: integer
 *                       example: 6
 *                     medium_count:
 *                       type: integer
 *                       example: 7
 *                     hard_count:
 *                       type: integer
 *                       example: 2
 *                     points_per_question:
 *                       type: number
 *                       example: 0.5
 *                     order_index:
 *                       type: integer
 *                       example: 1
 *                 example:
 *                   - category_id: "cat-123-abc"
 *                     career_criteria_id: null
 *                     question_type: "MULTIPLE_CHOICE"
 *                     difficulty_level: null
 *                     quantity: 15
 *                     easy_count: 6
 *                     medium_count: 7
 *                     hard_count: 2
 *                     points_per_question: 0.5
 *                     order_index: 1
 *                   - category_id: "cat-456-def"
 *                     question_type: "ESSAY"
 *                     difficulty_level: "HARD"
 *                     quantity: 1
 *                     easy_count: 0
 *                     medium_count: 0
 *                     hard_count: 1
 *                     points_per_question: 2.5
 *                     order_index: 2
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
 *               title:
 *                 type: string
 *                 example: Đề thi cuối kỳ Toán học (Cập nhật)
 *               description:
 *                 type: string
 *                 example: Đề thi cuối kỳ 1 môn Toán lớp 10 - Phiên bản mới
 *               class_id:
 *                 type: string
 *                 example: class-456-xyz
 *               exam_type:
 *                 type: string
 *                 enum: [PRACTICE, QUIZ, MIDTERM, FINAL, MOCK_TEST]
 *                 example: FINAL
 *               duration_minutes:
 *                 type: integer
 *                 example: 120
 *               passing_score:
 *                 type: number
 *                 example: 7
 *               total_points:
 *                 type: number
 *                 example: 12
 *               instructions:
 *                 type: string
 *                 example: Hướng dẫn đã cập nhật
 *               is_shuffle_questions:
 *                 type: boolean
 *                 example: false
 *               is_shuffle_options:
 *                 type: boolean
 *                 example: false
 *               show_results_immediately:
 *                 type: boolean
 *                 example: true
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-06-20T08:00:00.000Z
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-06-20T11:00:00.000Z
 *               max_attempts:
 *                 type: integer
 *                 example: 3
 *               is_published:
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


