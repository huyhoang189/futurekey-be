const express = require("express");
const router = express.Router();
const studentExamsController = require("../../controllers/students/studentExams.controller");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: V2 - Students - Exams
 *   description: API cho học sinh làm bài thi
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentAnswer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: ans-123-abc
 *         question_id:
 *           type: string
 *           example: ques-123-abc
 *         answer_data:
 *           type: object
 *           description: Dữ liệu câu trả lời (định dạng phụ thuộc vào loại câu hỏi)
 *           example: {"selected": ["A", "C"]}
 *         max_score:
 *           type: number
 *           example: 10
 *         earned_score:
 *           type: number
 *           example: 10
 *         is_correct:
 *           type: boolean
 *           example: true
 *         graded_by:
 *           type: string
 *           example: teacher-123-abc
 *         graded_at:
 *           type: string
 *           format: date-time
 *         feedback:
 *           type: string
 *           example: Câu trả lời chính xác
 *     StudentExamAttempt:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: attempt-123-abc
 *         exam_id:
 *           type: string
 *           example: exam-123-abc
 *         student_id:
 *           type: string
 *           example: student-123-abc
 *         attempt_number:
 *           type: integer
 *           example: 1
 *         status:
 *           type: string
 *           enum: [IN_PROGRESS, SUBMITTED, GRADED]
 *           example: GRADED
 *         started_at:
 *           type: string
 *           format: date-time
 *         submitted_at:
 *           type: string
 *           format: date-time
 *         duration_seconds:
 *           type: integer
 *           example: 3600
 *         total_score:
 *           type: number
 *           example: 85
 *         earned_score:
 *           type: number
 *           example: 72.5
 *         snapshot_data:
 *           type: object
 *           description: Dữ liệu snapshot câu hỏi và đáp án
 *           example: {"questions": [], "exam_config": {}}
 *         graded_by:
 *           type: string
 *           example: teacher-123-abc
 *         graded_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v2/students/student-exams/{examId}/start:
 *   post:
 *     summary: Bắt đầu bài thi (sinh viên)
 *     description: Tạo attempt mới, random câu hỏi theo phân bổ, shuffle câu hỏi/đáp án, lưu snapshot
 *     tags: [V2 - Students - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đề thi
 *     responses:
 *       201:
 *         description: Bắt đầu bài thi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     attempt:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: attempt-123-abc
 *                         exam_id:
 *                           type: string
 *                           example: exam-123-abc
 *                         student_id:
 *                           type: string
 *                           example: student-123-abc
 *                         attempt_number:
 *                           type: integer
 *                           example: 1
 *                         status:
 *                           type: string
 *                           example: IN_PROGRESS
 *                         started_at:
 *                           type: string
 *                           format: date-time
 *                         duration_seconds:
 *                           type: integer
 *                           example: 3600
 *                         total_score:
 *                           type: number
 *                           example: 100
 *                     questions:
 *                       type: array
 *                       description: Danh sách câu hỏi đã shuffle (nếu cấu hình)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: ques-456-def
 *                           question_text:
 *                             type: string
 *                             example: Tính diện tích hình vuông cạnh 5cm?
 *                           question_type:
 *                             type: string
 *                             example: MULTIPLE_CHOICE
 *                           max_score:
 *                             type: number
 *                             example: 10
 *                           options:
 *                             type: array
 *                             description: Đáp án đã shuffle (nếu cấu hình)
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   example: opt-789-ghi
 *                                 option_text:
 *                                   type: string
 *                                   example: 25 cm²
 *                                 order_index:
 *                                   type: integer
 *                                   example: 1
 *       400:
 *         description: Đề thi chưa công bố, hết lượt thi, hoặc ngoài thời gian thi
 */
router.post("/:examId/start", checkAuth, studentExamsController.startExam);

/**
 * @swagger
 * /api/v2/students/student-exams/attempts/{attemptId}/answers:
 *   post:
 *     summary: Lưu câu trả lời (auto-save)
 *     description: Lưu hoặc cập nhật câu trả lời trong quá trình làm bài
 *     tags: [V2 - Students - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của attempt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question_id
 *               - answer_data
 *             properties:
 *               question_id:
 *                 type: string
 *                 example: ques-456-def
 *               answer_data:
 *                 type: object
 *                 description: Định dạng dữ liệu phụ thuộc vào loại câu hỏi
 *                 oneOf:
 *                   - description: TRUE_FALSE
 *                     example: {"value": true}
 *                   - description: MULTIPLE_CHOICE
 *                     example: {"selected": ["A", "C"]}
 *                   - description: SHORT_ANSWER
 *                     example: {"text": "25 cm²"}
 *                   - description: ESSAY
 *                     example: {"text": "Diện tích hình vuông được tính bằng công thức S = a², với a là cạnh hình vuông..."}
 *           examples:
 *             trueFalse:
 *               summary: Câu hỏi đúng/sai
 *               value:
 *                 question_id: "ques-123-abc"
 *                 answer_data:
 *                   value: true
 *             multipleChoice:
 *               summary: Câu hỏi trắc nghiệm nhiều đáp án
 *               value:
 *                 question_id: "ques-456-def"
 *                 answer_data:
 *                   selected: ["A", "C"]
 *             shortAnswer:
 *               summary: Câu hỏi trả lời ngắn
 *               value:
 *                 question_id: "ques-789-ghi"
 *                 answer_data:
 *                   text: "25 cm²"
 *             essay:
 *               summary: Câu hỏi tự luận
 *               value:
 *                 question_id: "ques-101-jkl"
 *                 answer_data:
 *                   text: "Diện tích hình vuông được tính bằng công thức S = a²..."
 *     responses:
 *       200:
 *         description: Lưu câu trả lời thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudentAnswer'
 *       400:
 *         description: Attempt đã nộp hoặc hết thời gian
 */
router.post("/attempts/:attemptId/answers", checkAuth, studentExamsController.saveAnswer);

/**
 * @swagger
 * /api/v2/students/student-exams/attempts/{attemptId}/submit:
 *   post:
 *     summary: Nộp bài thi
 *     description: Nộp bài thi và trigger auto-grading (trừ câu tự luận)
 *     tags: [V2 - Students - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của attempt
 *     responses:
 *       200:
 *         description: Nộp bài thành công
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
 *                   example: Exam submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     attempt_id:
 *                       type: string
 *                       example: attempt-123-abc
 *                     status:
 *                       type: string
 *                       example: SUBMITTED
 *                     submitted_at:
 *                       type: string
 *                       format: date-time
 *                     auto_graded:
 *                       type: boolean
 *                       example: true
 *                       description: True nếu không có câu tự luận
 *       400:
 *         description: Attempt đã nộp hoặc không hợp lệ
 */
router.post("/attempts/:attemptId/submit", checkAuth, studentExamsController.submitExam);

/**
 * @swagger
 * /api/v2/students/student-exams/attempts/{attemptId}/results:
 *   get:
 *     summary: Xem kết quả bài thi
 *     description: Lấy kết quả chi tiết bài thi (sau khi chấm xong)
 *     tags: [V2 - Students - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của attempt
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
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         attempt_id:
 *                           type: string
 *                           example: attempt-123-abc
 *                         exam_title:
 *                           type: string
 *                           example: Đề thi giữa kỳ Toán học
 *                         student_id:
 *                           type: string
 *                           example: student-123-abc
 *                         attempt_number:
 *                           type: integer
 *                           example: 1
 *                         status:
 *                           type: string
 *                           example: GRADED
 *                         total_score:
 *                           type: number
 *                           example: 100
 *                         earned_score:
 *                           type: number
 *                           example: 85
 *                         percentage:
 *                           type: number
 *                           example: 85
 *                         passed:
 *                           type: boolean
 *                           example: true
 *                         duration_seconds:
 *                           type: integer
 *                           example: 3240
 *                         started_at:
 *                           type: string
 *                           format: date-time
 *                         submitted_at:
 *                           type: string
 *                           format: date-time
 *                         graded_at:
 *                           type: string
 *                           format: date-time
 *                     detailed_answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question_id:
 *                             type: string
 *                             example: ques-456-def
 *                           question_text:
 *                             type: string
 *                             example: Tính diện tích hình vuông cạnh 5cm?
 *                           question_type:
 *                             type: string
 *                             example: MULTIPLE_CHOICE
 *                           student_answer:
 *                             type: object
 *                             example: {"selected": ["A"]}
 *                           correct_answer:
 *                             type: object
 *                             example: {"correct_options": ["A"]}
 *                           max_score:
 *                             type: number
 *                             example: 10
 *                           earned_score:
 *                             type: number
 *                             example: 10
 *                           is_correct:
 *                             type: boolean
 *                             example: true
 *                           feedback:
 *                             type: string
 *                             example: Câu trả lời chính xác
 *                     category_statistics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category_id:
 *                             type: string
 *                             example: cat-hinhoc-123
 *                           category_name:
 *                             type: string
 *                             example: Hình học
 *                           total_questions:
 *                             type: integer
 *                             example: 10
 *                           correct_answers:
 *                             type: integer
 *                             example: 8
 *                           max_score:
 *                             type: number
 *                             example: 50
 *                           earned_score:
 *                             type: number
 *                             example: 42
 *                           percentage:
 *                             type: number
 *                             example: 84
 *       400:
 *         description: Attempt chưa được chấm điểm
 */
router.get("/attempts/:attemptId/results", checkAuth, studentExamsController.getExamResults);

/**
 * @swagger
 * /api/v2/students/student-exams/need-grading:
 *   get:
 *     summary: Lấy danh sách bài thi cần chấm (giáo viên)
 *     description: Lấy danh sách các câu tự luận chưa được chấm điểm
 *     tags: [V2 - Students - Exams]
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
 *         name: exam_id
 *         schema:
 *           type: string
 *         description: Lọc theo đề thi
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
 *                     type: object
 *                     properties:
 *                       answer_id:
 *                         type: string
 *                         example: ans-123-abc
 *                       attempt_id:
 *                         type: string
 *                         example: attempt-456-def
 *                       exam_id:
 *                         type: string
 *                         example: exam-789-ghi
 *                       exam_title:
 *                         type: string
 *                         example: Đề thi giữa kỳ Toán học
 *                       student_id:
 *                         type: string
 *                         example: student-101-jkl
 *                       student_name:
 *                         type: string
 *                         example: Nguyễn Văn A
 *                       question_id:
 *                         type: string
 *                         example: ques-202-mno
 *                       question_text:
 *                         type: string
 *                         example: Giải thích định lý Pythagoras
 *                       question_type:
 *                         type: string
 *                         example: ESSAY
 *                       answer_data:
 *                         type: object
 *                         example: {"text": "Định lý Pythagoras nói rằng..."}
 *                       max_score:
 *                         type: number
 *                         example: 20
 *                       submitted_at:
 *                         type: string
 *                         format: date-time
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
router.get("/need-grading", checkAuth, studentExamsController.getExamsNeedGrading);

/**
 * @swagger
 * /api/v2/students/student-exams/answers/{answerId}/grade:
 *   post:
 *     summary: Chấm điểm câu tự luận (giáo viên)
 *     description: Chấm điểm câu ESSAY hoặc SHORT_ANSWER thủ công
 *     tags: [V2 - Students - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của câu trả lời
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - earned_score
 *             properties:
 *               earned_score:
 *                 type: number
 *                 example: 18
 *                 description: Điểm đạt được (0 - max_score)
 *               feedback:
 *                 type: string
 *                 example: Câu trả lời tốt, giải thích rõ ràng. Cần bổ sung ví dụ cụ thể.
 *     responses:
 *       200:
 *         description: Chấm điểm thành công
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
 *                   example: Answer graded successfully
 *                 data:
 *                   $ref: '#/components/schemas/StudentAnswer'
 *       400:
 *         description: Điểm không hợp lệ hoặc câu hỏi không phải tự luận
 */
router.post("/answers/:answerId/grade", checkAuth, studentExamsController.gradeEssayQuestion);

module.exports = router;


