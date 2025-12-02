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
 *     summary: Bắt đầu bài thi - Random câu hỏi và tạo snapshot
 *     description: |
 *       API quan trọng nhất - Tự động generate đề thi cá nhân cho học sinh.
 *       
 *       **Quy trình tự động:**
 *       1. **Validate**: Kiểm tra đề thi (published, thời gian, số lần thi)
 *       2. **Random câu hỏi**: Lấy ngẫu nhiên từ DB theo distributions
 *          - Priority: usage_count thấp → đề thi cân bằng
 *          - Phân bổ theo: category, difficulty (EASY/MEDIUM/HARD), question_type
 *       3. **Shuffle**: Xáo trộn câu hỏi và đáp án (nếu cấu hình)
 *       4. **Snapshot**: Lưu toàn bộ câu hỏi + đáp án vào attempt.snapshot_data
 *          - BAO GỔM: content, options, correct_answer, is_correct, explanation
 *          - Mục đích: Đề không thay đổi dù admin sửa DB sau này
 *       5. **Update usage_count**: Tăng đếm số lần câu hỏi được dùng
 *       6. **Create attempt**: Trạng thái IN_PROGRESS, bắt đầu đếm giờ
 *       
 *       **Nếu đã có attempt IN_PROGRESS:**
 *       - Không tạo mới, trả về attempt cũ (cho phép tiếp tục làm)
 *       
 *       **Validations:**
 *       - is_published = false → Lỗi "Exam is not published yet"
 *       - now < start_time → Lỗi "Exam has not started yet"
 *       - now > end_time → Lỗi "Exam has ended"
 *       - Đạt max_attempts → Lỗi "Maximum attempts reached"
 *       - Không đủ câu hỏi trong DB → Lỗi "Not enough questions"
 *       
 *       **Response:**
 *       - attempt: Thông tin attempt (id, status, start_time, max_score,...)
 *       - questions: Mảng câu hỏi đầy đủ (content, options, points) đã shuffle
 *       
 *       **Lưu ý:**
 *       - Mỗi học sinh nhận đề KHÁC NHAU (random)
 *       - Đáp án đã được lưu trong snapshot (không phụ thuộc DB)
 *       - Questions trả về KHÔNG bao gồm correct_answer/is_correct (anti-cheat)
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
 *     summary: Lưu câu trả lời - Auto-save mỗi khi học sinh chọn đáp án
 *     description: |
 *       Upsert (create hoặc update) câu trả lời của học sinh.
 *       
 *       **Cách hoạt động:**
 *       - Lần đầu trả lời → CREATE mới (student_answers)
 *       - Thay đổi đáp án → UPDATE answer_data
 *       - Unique constraint: (attempt_id, question_id) → Mỗi câu chỉ 1 answer
 *       
 *       **Validations:**
 *       - Attempt không tồn tại → Lỗi "Attempt not found"
 *       - Attempt.status ≠ IN_PROGRESS → Lỗi "Cannot save answer. Exam is not in progress"
 *       
 *       **answer_data format theo question_type:**
 *       
 *       1. **TRUE_FALSE**: `{ "value": true }` hoặc `{ "value": false }`
 *       
 *       2. **MULTIPLE_CHOICE**: 
 *          - 1 đáp án: `{ "selected": ["A"] }`
 *          - Nhiều đáp án: `{ "selected": ["A", "C", "D"] }`
 *       
 *       3. **SHORT_ANSWER**: `{ "text": "25 cm²" }`
 *       
 *       4. **ESSAY**: `{ "text": "Bài luận dài..." }`
 *       
 *       **Use case:**
 *       - Frontend call API này MỔI KHI học sinh:
 *         + Chọn/bỏ chọn checkbox
 *         + Nhập text (debounce 500ms)
 *         + Chuyển sang câu khác
 *       - Mục đích: Không mất dữ liệu khi reload trang/mất mạng
 *       
 *       **Lưu ý:**
 *       - KHÔNG chấm điểm ở đây (chỉ lưu answer_data)
 *       - Chấm điểm khi nộp bài (POST submit)
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
 *     summary: Nộp bài thi - Tự động chấm điểm trắc nghiệm
 *     description: |
 *       Kết thúc bài thi và trigger auto-grading cho câu trắc nghiệm.
 *       
 *       **Quy trình tự động:**
 *       1. **Update attempt**:
 *          - submit_time = now
 *          - duration_seconds = (submit_time - start_time) / 1000
 *          - status = SUBMITTED
 *       
 *       2. **Auto-grading** (chạy tự động):
 *          - Chấm câu MULTIPLE_CHOICE:
 *            + Lấy correct_answer từ snapshot (KHÔNG query DB)
 *            + So sánh với student answer
 *            + is_correct = true/false
 *            + score = max_score (nếu đúng) hoặc 0
 *          
 *          - Chấm câu TRUE_FALSE:
 *            + Lấy correct_answer từ snapshot
 *            + So sánh với student answer.value
 *          
 *          - Bỏ qua câu ESSAY và SHORT_ANSWER (chấm thủ công sau)
 *       
 *       3. **Tính tổng điểm**:
 *          - total_score = Σ(score của các câu trắc nghiệm)
 *          - Update attempt.total_score, is_auto_graded = true
 *          - status = GRADED (nếu không có tự luận) hoặc giữ SUBMITTED
 *       
 *       **Validations:**
 *       - Attempt không tồn tại → Lỗi "Attempt not found"
 *       - status ≠ IN_PROGRESS → Lỗi "Exam is not in progress" (không nộp lại)
 *       
 *       **Response:**
 *       - message: "Exam submitted successfully"
 *       - duration_seconds: Thời gian làm bài (giây)
 *       - auto_graded: true nếu chấm xong, false nếu có tự luận chờ giáo viên
 *       
 *       **Lưu ý quan trọng:**
 *       - Auto-grading dùng SNAPSHOT, KHÔNG query database
 *         → Nếu admin sửa câu hỏi sau khi học sinh start, không ảnh hưởng kết quả
 *       - Câu tự luận (ESSAY/SHORT_ANSWER) đợi giáo viên chấm thủ công
 *       - Học sinh CHỈ nộp được 1 lần (không edit sau khi nộp)
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
 *     summary: Xem kết quả chi tiết bài thi - Breakdown từng câu + thống kê
 *     description: |
 *       Lấy kết quả đầy đủ của bài thi (sau khi đã chấm xong).
 *       
 *       **Response gồm 3 phần:**
 *       
 *       **1. summary** - Tổng quan:
 *       - exam_title, attempt_number
 *       - total_score, earned_score, percentage
 *       - passed (true/false) - So với passing_score
 *       - duration_seconds - Thời gian làm bài
 *       - started_at, submitted_at, graded_at
 *       
 *       **2. detailed_answers** - Chi tiết từng câu:
 *       - question_id, question_text, question_type
 *       - student_answer: Đáp án học sinh chọn
 *       - correct_answer: Đáp án đúng (nếu show_results_immediately = true)
 *       - is_correct: true/false
 *       - max_score, earned_score
 *       - feedback: Nhận xét của giáo viên (nếu có)
 *       
 *       **3. category_statistics** - Thống kê theo danh mục:
 *       - category_name: Hình học, Đại số, Vật lý,...
 *       - total_questions: Tổng số câu trong category
 *       - correct_answers: Số câu trả lời đúng
 *       - max_score, earned_score, percentage
 *       
 *       **Điều kiện xem kết quả:**
 *       - Nếu show_results_immediately = false:
 *         + Phải chờ giáo viên chấm hết tự luận (status = GRADED)
 *       - Nếu show_results_immediately = true:
 *         + Xem ngay sau khi nộp bài (dù chưa chấm tự luận)
 *       
 *       **Use case:**
 *       - Học sinh xem lại bài thi
 *       - Xem câu nào sai, đáp án đúng là gì
 *       - Phân tích điểm mạnh/yếu theo category
 *       
 *       **Lưu ý:**
 *       - correct_answer chỉ hiển thị nếu exam.show_results_immediately = true
 *       - Nếu còn câu tự luận chưa chấm: earned_score chưa bao gồm điểm tự luận
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
 *     summary: Lấy danh sách câu tự luận cần chấm (giáo viên)
 *     description: |
 *       Dashboard cho giáo viên - Hiển thị tất cả câu ESSAY/SHORT_ANSWER chưa chấm.
 *       
 *       **Logic query:**
 *       - Tìm attempts có status = SUBMITTED hoặc GRADED
 *       - Lọc các answers có:
 *         + question_type IN (ESSAY, SHORT_ANSWER)
 *         + is_correct = null (chưa chấm)
 *       
 *       **Response mỗi item gồm:**
 *       - answer_id: ID cần dùng để chấm (POST /answers/{answerId}/grade)
 *       - attempt_id, exam_id, exam_title
 *       - student_id, student_name
 *       - question_id, question_text
 *       - answer_data: Bài làm của học sinh `{ "text": "..." }`
 *       - max_score: Điểm tối đa của câu
 *       - submitted_at: Thời gian nộp bài
 *       
 *       **Filters:**
 *       - exam_id: Lọc theo đề thi cụ thể
 *       - page, limit: Pagination
 *       
 *       **Use case:**
 *       - Dashboard giáo viên: "Bạn có 50 câu tự luận cần chấm"
 *       - Sắp xếp theo thời gian nộp (submit_time ASC) → Chấm câu cũ trước
 *       - Hiển thị thông tin học sinh và bài làm
 *       
 *       **Workflow chấm bài:**
 *       1. GET /need-grading → Lấy danh sách
 *       2. Hiển thị question_text + answer_data.text cho giáo viên
 *       3. Giáo viên nhập earned_score + feedback
 *       4. POST /answers/{answerId}/grade → Chấm điểm
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
 *     description: |
 *       Giáo viên chấm thủ công các câu ESSAY hoặc SHORT_ANSWER.
 *       
 *       **Quy trình chấm:**
 *       1. **Validate**:
 *          - Kiểm tra answer tồn tại
 *          - Kiểm tra question_type IN (ESSAY, SHORT_ANSWER)
 *          - earned_score phải 0 ≤ earned_score ≤ max_score
 *       
 *       2. **Update student_answers**:
 *          - earned_score: Điểm giáo viên cho
 *          - feedback: Nhận xét (optional)
 *          - is_correct: null (không áp dụng cho tự luận)
 *          - graded_by: ID giáo viên (từ JWT)
 *          - graded_at: Timestamp
 *       
 *       3. **Kiểm tra attempt**:
 *          - Nếu tất cả câu đã chấm xong:
 *            + Tính lại total_score (trắc nghiệm + tự luận)
 *            + Update attempt.status = GRADED
 *            + Update attempt.graded_at, graded_by
 *       
 *       **Request body:**
 *       - earned_score (required): Điểm số (0 - max_score)
 *       - feedback (optional): Nhận xét chi tiết
 *       
 *       **Validations:**
 *       - answer_id không tồn tại → Lỗi "Answer not found"
 *       - question_type không phải tự luận → Lỗi (trắc nghiệm tự động chấm)
 *       - earned_score < 0 hoặc > max_score → Lỗi "Invalid score"
 *       
 *       **Use case:**
 *       - Giáo viên chấm từng câu tự luận
 *       - Hệ thống tự động cập nhật tổng điểm khi chấm xong hết
 *       
 *       **Ví dụ:**
 *       ```json
 *       {
 *         "earned_score": 18,
 *         "feedback": "Bài viết tốt, lập luận rõ ràng. Cần bổ sung ví dụ cụ thể hơn."
 *       }
 *       ```
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


