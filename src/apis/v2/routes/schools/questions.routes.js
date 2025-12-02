const express = require("express");
const router = express.Router();
const questionsController = require("../../controllers/schools/questions.controller");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Questions
 *   description: API quản lý câu hỏi
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestionOption:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: opt-123-abc
 *         option_text:
 *           type: string
 *           example: Lựa chọn A
 *         is_correct:
 *           type: boolean
 *           example: true
 *         order_index:
 *           type: integer
 *           example: 1
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: ques-123-abc
 *         question_text:
 *           type: string
 *           example: Tính diện tích hình vuông có cạnh 5cm?
 *         question_type:
 *           type: string
 *           enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY]
 *           example: MULTIPLE_CHOICE
 *         difficulty:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *           example: EASY
 *         max_score:
 *           type: number
 *           example: 10
 *         explanation:
 *           type: string
 *           example: Công thức S = a²
 *         category_id:
 *           type: string
 *           example: cat-123-abc
 *         career_criteria_id:
 *           type: string
 *           example: criteria-123-abc
 *         metadata:
 *           type: object
 *           description: |
 *             Metadata linh hoạt tùy loại câu hỏi:
 *             - TRUE_FALSE: {"correct_answer": true/false}
 *             - MULTIPLE_CHOICE: Đáp án lưu trong question_options
 *             - SHORT_ANSWER: {"correct_answer": "text", "case_sensitive": false}
 *             - ESSAY: {"min_words": 100, "max_words": 500, "grading_criteria": "..."}
 *             Có thể thêm: hint, time_limit, difficulty_note, reference_materials, v.v.
 *           example: {"correct_answer": "25 cm²", "hint": "S = a²", "time_limit": 60}
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["hình học", "diện tích"]
 *         usage_count:
 *           type: integer
 *           example: 5
 *         created_by:
 *           type: string
 *           example: user-123-abc
 *         is_active:
 *           type: boolean
 *           example: true
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuestionOption'
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v2/schools/questions:
 *   get:
 *     summary: Lấy danh sách câu hỏi
 *     tags: [V2 - Schools - Questions]
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
 *         description: Tìm kiếm theo nội dung câu hỏi
 *       - in: query
 *         name: question_type
 *         schema:
 *           type: string
 *           enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY]
 *         description: Lọc theo loại câu hỏi
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *         description: Lọc theo độ khó
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: career_criteria_id
 *         schema:
 *           type: string
 *         description: Lọc theo tiêu chí nghề nghiệp
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
 *                     $ref: '#/components/schemas/Question'
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
 */
router.get("/", checkAuth, questionsController.getAllQuestions);

/**
 * @swagger
 * /api/v2/schools/questions/{id}:
 *   get:
 *     summary: Lấy câu hỏi theo ID
 *     tags: [V2 - Schools - Questions]
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
 *                   $ref: '#/components/schemas/Question'
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", checkAuth, questionsController.getQuestionById);

/**
 * @swagger
 * /api/v2/schools/questions:
 *   post:
 *     summary: Tạo câu hỏi mới
 *     tags: [V2 - Schools - Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question_text
 *               - question_type
 *               - difficulty
 *               - max_score
 *               - category_id
 *               - career_criteria_id
 *             properties:
 *               question_text:
 *                 type: string
 *                 example: Tính chu vi hình tròn có bán kính 10cm?
 *               question_type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY]
 *                 example: MULTIPLE_CHOICE
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 example: MEDIUM
 *               max_score:
 *                 type: number
 *                 example: 15
 *               explanation:
 *                 type: string
 *                 example: Công thức C = 2πr
 *               category_id:
 *                 type: string
 *                 example: cat-hinhoc-123
 *               career_criteria_id:
 *                 type: string
 *                 example: criteria-toantu-456
 *               metadata:
 *                 type: object
 *                 description: |
 *                   Metadata linh hoạt cho từng loại câu hỏi:
 *                   - TRUE_FALSE: {"correct_answer": true}
 *                   - MULTIPLE_CHOICE: Đáp án được lưu trong bảng question_options
 *                   - SHORT_ANSWER: {"correct_answer": "62.8 cm", "case_sensitive": false}
 *                   - ESSAY: {"min_words": 100, "max_words": 500, "grading_criteria": "Đánh giá logic, ngữ pháp"}
 *                   Có thể thêm các trường: hint, time_limit, difficulty_note, explanation_video, reference_materials
 *                 example: {
 *                   "hint": "Sử dụng π ≈ 3.14",
 *                   "time_limit": 120,
 *                   "explanation_video": "https://youtube.com/watch?v=...",
 *                   "difficulty_note": "Cần nhớ công thức chu vi hình tròn"
 *                 }
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["hình học", "chu vi", "hình tròn"]
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     option_text:
 *                       type: string
 *                       example: 62.8 cm
 *                     is_correct:
 *                       type: boolean
 *                       example: true
 *                     order_index:
 *                       type: integer
 *                       example: 1
 *                 example:
 *                   - option_text: "62.8 cm"
 *                     is_correct: true
 *                     order_index: 1
 *                   - option_text: "31.4 cm"
 *                     is_correct: false
 *                     order_index: 2
 *                   - option_text: "314 cm"
 *                     is_correct: false
 *                     order_index: 3
 *                   - option_text: "20 cm"
 *                     is_correct: false
 *                     order_index: 4
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
 *                   $ref: '#/components/schemas/Question'
 */
router.post("/", checkAuth, questionsController.createQuestion);

/**
 * @swagger
 * /api/v2/schools/questions/{id}:
 *   put:
 *     summary: Cập nhật câu hỏi
 *     tags: [V2 - Schools - Questions]
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
 *               question_text:
 *                 type: string
 *                 example: Tính chu vi hình tròn có đường kính 20cm?
 *               question_type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY]
 *                 example: SHORT_ANSWER
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 example: HARD
 *               max_score:
 *                 type: number
 *                 example: 20
 *               explanation:
 *                 type: string
 *                 example: C = πd hoặc C = 2πr
 *               category_id:
 *                 type: string
 *                 example: cat-hinhoc-456
 *               career_criteria_id:
 *                 type: string
 *                 example: criteria-toantu-789
 *               metadata:
 *                 type: object
 *                 description: |
 *                   Metadata linh hoạt cho từng loại câu hỏi:
 *                   - TRUE_FALSE: {"correct_answer": false}
 *                   - MULTIPLE_CHOICE: Đáp án được lưu trong bảng question_options
 *                   - SHORT_ANSWER: {"correct_answer": "62.8 cm", "case_sensitive": false, "accept_variations": ["~63", "20π"]}
 *                   - ESSAY: {"min_words": 150, "max_words": 800, "grading_criteria": "Đánh giá logic, độ sâu, trình bày"}
 *                   Các trường tùy chỉnh khác: hint, time_limit, reference_materials, difficulty_note
 *                 example: {
 *                   "correct_answer": "62.8 cm",
 *                   "case_sensitive": false,
 *                   "accept_variations": ["62.8", "~63", "20π"],
 *                   "hint": "C = πd hoặc C = 2πr",
 *                   "time_limit": 180,
 *                   "reference_materials": "Cho phép sử dụng máy tính"
 *                 }
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["hình học", "chu vi"]
 *               is_active:
 *                 type: boolean
 *                 example: false
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: opt-123-abc
 *                     option_text:
 *                       type: string
 *                       example: 62.8 cm
 *                     is_correct:
 *                       type: boolean
 *                       example: true
 *                     order_index:
 *                       type: integer
 *                       example: 1
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
 *                   $ref: '#/components/schemas/Question'
 */
router.put("/:id", checkAuth, questionsController.updateQuestion);

/**
 * @swagger
 * /api/v2/schools/questions/{id}:
 *   delete:
 *     summary: Xóa câu hỏi
 *     tags: [V2 - Schools - Questions]
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
 *                   example: Question deleted successfully
 *       400:
 *         description: Không thể xóa (đang được sử dụng trong đề thi)
 */
router.delete("/:id", checkAuth, questionsController.deleteQuestion);

module.exports = router;


