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
 *           description: |
 *             Dữ liệu câu trả lời - Format phụ thuộc loại câu hỏi:
 *             - MULTIPLE_CHOICE/TRUE_FALSE (1 đáp án): "opt-uuid-123" (String)
 *             - MULTIPLE_CHOICE (nhiều đáp án): ["opt-uuid-1", "opt-uuid-2"] (Array)
 *             - ESSAY/SHORT_ANSWER: "Văn bản câu trả lời..." (String)
 *           oneOf:
 *             - type: string
 *               example: opt-789-abc-def
 *             - type: array
 *               items:
 *                 type: string
 *               example: ["opt-111-aaa", "opt-222-bbb"]
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
 * /api/v2/students/student-exams/start:
 *   post:
 *     summary: Bắt đầu bài thi - Tự động tìm config và random câu hỏi
 *     description: |
 *       API quan trọng nhất - Tự động generate đề thi cá nhân cho học sinh.
 *
 *       **Mô hình mới (KHÔNG còn bảng exams):**
 *       - Học sinh chỉ truyền exam_type + career_criteria_id (nếu có)
 *       - Hệ thống TỰ ĐỘNG tìm exam_config phù hợp:
 *         + COMPREHENSIVE: Tìm config duy nhất có exam_type_scope = COMPREHENSIVE
 *         + CRITERIA_SPECIFIC: Tìm config theo career_criteria_id
 *       - Random câu hỏi từ ngân hàng theo distributions
 *       - Lưu snapshot để đề không đổi khi admin sửa DB
 *
 *       **Quy trình tự động:**
 *       1. **Tìm exam_config**:
 *          - COMPREHENSIVE: WHERE exam_type_scope = 'COMPREHENSIVE' AND career_criteria_id IS NULL
 *          - CRITERIA_SPECIFIC: WHERE exam_type_scope = 'CRITERIA_SPECIFIC' AND career_criteria_id = ?
 *
 *       2. **Lấy distributions**: Query exam_config_distributions theo config_id
 *
 *       3. **Random câu hỏi** theo từng distribution:
 *          - WHERE category_id = ? AND difficulty_level = ? AND is_active = true
 *          - ORDER BY usage_count ASC (ưu tiên câu ít dùng)
 *          - LIMIT theo quantity (easy_count, medium_count, hard_count)
 *
 *       4. **Shuffle**: Xáo trộn câu hỏi và đáp án
 *
 *       5. **Snapshot**: Lưu toàn bộ vào attempt.snapshot_data
 *          - BAO GỔM: content, options, correct_answer, explanation
 *          - Mục đích: Đề không thay đổi dù admin sửa DB sau này
 *
 *       6. **Update usage_count**: Tăng đếm số lần câu hỏi được dùng
 *
 *       7. **Create attempt**: Status = IN_PROGRESS
 *
 *       **Nếu đã có attempt IN_PROGRESS:**
 *       - Không tạo mới, trả về attempt cũ (cho phép tiếp tục làm)
 *
 *       **Validations:**
 *       - COMPREHENSIVE: Chỉ 1 config duy nhất, nếu không có → Lỗi "COMPREHENSIVE exam config not found"
 *       - CRITERIA_SPECIFIC: Phải truyền career_criteria_id, không tìm thấy config → Lỗi "Exam config not found for criteria"
 *       - Không đủ câu hỏi trong DB → Lỗi "Not enough questions in category X"
 *
 *       **Response:**
 *       - attempt: Thông tin attempt (id, status, exam_config_id, started_at,...)
 *       - questions: Mảng câu hỏi đầy đủ (content, options, points) đã shuffle
 *       - config: Thông tin exam_config (time_limit_minutes, total_points, pass_score)
 *
 *       **Lưu ý:**
 *       - Mỗi học sinh nhận đề KHÁC NHAU (random)
 *       - Questions trả về KHÔNG bao gồm correct_answer/is_correct (anti-cheat)
 *     tags: [V2 - Students - Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exam_type
 *             properties:
 *               exam_type:
 *                 type: string
 *                 enum: [COMPREHENSIVE, CRITERIA_SPECIFIC]
 *                 example: COMPREHENSIVE
 *                 description: Loại bài thi - COMPREHENSIVE (tổng hợp) hoặc CRITERIA_SPECIFIC (theo tiêu chí)
 *               career_criteria_id:
 *                 type: string
 *                 example: 4f704084-c29a-11f0-afc5-2626c197d041
 *                 description: Bắt buộc nếu exam_type = CRITERIA_SPECIFIC, null nếu COMPREHENSIVE
 *           examples:
 *             comprehensive:
 *               summary: Bài thi tổng hợp
 *               value:
 *                 exam_type: COMPREHENSIVE
 *             criteriaSpecific:
 *               summary: Bài thi theo tiêu chí
 *               value:
 *                 exam_type: CRITERIA_SPECIFIC
 *                 career_criteria_id: 4f704084-c29a-11f0-afc5-2626c197d041
 *     responses:
 *       200:
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
 *                         exam_config_id:
 *                           type: string
 *                           example: config-123-abc
 *                           description: Config được tìm tự động dựa vào exam_type
 *                         student_id:
 *                           type: string
 *                           example: student-123-abc
 *                         exam_type:
 *                           type: string
 *                           example: COMPREHENSIVE
 *                         career_criteria_id:
 *                           type: string
 *                           example: null
 *                         status:
 *                           type: string
 *                           example: IN_PROGRESS
 *                         started_at:
 *                           type: string
 *                           format: date-time
 *                         total_score:
 *                           type: number
 *                           example: 10
 *                     questions:
 *                       type: array
 *                       description: Danh sách câu hỏi đã shuffle theo distributions
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: ques-456-def
 *                           content:
 *                             type: string
 *                             example: Bạn thích làm việc độc lập hay theo nhóm?
 *                           question_type:
 *                             type: string
 *                             example: MULTIPLE_CHOICE
 *                           points:
 *                             type: number
 *                             example: 1
 *                           options:
 *                             type: array
 *                             description: |
 *                               Đáp án đã shuffle. FE sẽ tự động sinh ABCD dựa trên order_index:
 *                               - order_index: 0 → Hiển thị "A"
 *                               - order_index: 1 → Hiển thị "B"
 *                               - order_index: 2 → Hiển thị "C"
 *                               - order_index: 3 → Hiển thị "D"
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   example: opt-789-ghi
 *                                   description: UUID của option - GỬI ID NÀY KHI SUBMIT
 *                                 option_text:
 *                                   type: string
 *                                   example: Làm việc độc lập
 *                                 order_index:
 *                                   type: integer
 *                                   example: 0
 *                                   description: Thứ tự hiển thị (0=A, 1=B, 2=C, 3=D)
 *                     config:
 *                       type: object
 *                       properties:
 *                         config_name:
 *                           type: string
 *                           example: Bài kiểm tra tổng hợp - Khám phá bản thân
 *                         time_limit_minutes:
 *                           type: integer
 *                           example: 45
 *                         total_points:
 *                           type: number
 *                           example: 10
 *                         pass_score:
 *                           type: number
 *                           example: 5
 *       400:
 *         description: Không tìm thấy config hoặc không đủ câu hỏi
 *       404:
 *         description: Exam config not found
 */
router.post("/start", checkAuth, studentExamsController.startExam);

/**
 * @swagger
 * /api/v2/students/student-exams/attempts:
 *   get:
 *     summary: Lấy danh sách attempt của học sinh (có lọc)
 *     tags: [V2 - Students - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam_type
 *         schema:
 *           type: string
 *           enum: [COMPREHENSIVE, CRITERIA_SPECIFIC]
 *         description: Lọc theo loại bài thi
 *       - in: query
 *         name: career_criteria_id
 *         schema:
 *           type: string
 *         description: Lọc theo tiêu chí (dùng cho CRITERIA_SPECIFIC)
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
 *     responses:
 *       200:
 *         description: Danh sách attempt của học sinh hiện tại
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
 *                     $ref: '#/components/schemas/StudentExamAttempt'
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
 *                     totalPages:
 *                       type: integer
 */
router.get("/attempts", checkAuth, studentExamsController.getMyAttempts);

/**
 * @swagger
 * /api/v2/students/student-exams/attempts/{attemptId}:
 *   get:
 *     summary: Lấy chi tiết attempt (câu hỏi snapshot + answers của HS)
 *     tags: [V2 - Students - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID attempt của học sinh
 *     responses:
 *       200:
 *         description: Chi tiết attempt
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
 *                       $ref: '#/components/schemas/StudentExamAttempt'
 *                     questions:
 *                       type: array
 *                       description: Danh sách câu hỏi snapshot lưu trong attempt
 *                       items:
 *                         type: object
 *                     answers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StudentAnswer'
 *       404:
 *         description: Attempt không tồn tại hoặc không thuộc học sinh hiện tại
 */
router.get(
  "/attempts/:attemptId",
  checkAuth,
  studentExamsController.getAttemptDetails
);

/**
 * @swagger
 * /api/v2/students/student-exams/attempts/{attemptId}/answers:
 *   post:
 *     summary: "DEPRECATED - API này không còn được sử dụng"
 *     description: |
 *       ⚠️ **API ĐÃ DEPRECATED - KHÔNG SỬ DỤNG**
 *
 *       Hiện tại không cần lưu câu trả lời trong khi làm bài.
 *       Chỉ gửi tất cả câu trả lời 1 lần khi nộp bài qua endpoint:
 *       **POST /api/v2/students/student-exams/attempts/{attemptId}/submit**
 *
 *       Nếu cần auto-save trong khi làm bài, FE nên sử dụng:
 *       - LocalStorage/SessionStorage
 *       - IndexedDB
 *
 *       Lý do deprecated:
 *       - Giảm số lượng request không cần thiết
 *       - Snapshot approach đảm bảo không mất dữ liệu
 *       - Chấm điểm chỉ diễn ra 1 lần khi submit
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: API này không còn hoạt động
 *     responses:
 *       400:
 *         description: API deprecated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: This API is deprecated. Submit all answers at once using /submit endpoint
 */
router.post(
  "/attempts/:attemptId/answers",
  checkAuth,
  studentExamsController.saveAnswer
);

/**
 * @swagger
 * /api/v2/students/student-exams/attempts/{attemptId}/submit:
 *   post:
 *     summary: Nộp bài thi - Gửi tất cả câu trả lời và tự động chấm điểm
 *     description: |
 *       Kết thúc bài thi và trigger auto-grading cho câu trắc nghiệm.
 *
 *       **Format answer_data MỚI (sau khi bỏ option_key):**
 *
 *       1. **MULTIPLE_CHOICE / TRUE_FALSE (1 đáp án)**:
 *          ```json
 *          {
 *            "question_id": "ques-123",
 *            "answer_data": "opt-789-abc-def"  // ← UUID của option
 *          }
 *          ```
 *
 *       2. **MULTIPLE_CHOICE (nhiều đáp án đúng)**:
 *          ```json
 *          {
 *            "question_id": "ques-456",
 *            "answer_data": ["opt-111-aaa", "opt-222-bbb", "opt-333-ccc"]
 *          }
 *          ```
 *
 *       3. **ESSAY / SHORT_ANSWER**:
 *          ```json
 *          {
 *            "question_id": "ques-789",
 *            "answer_data": "Văn bản câu trả lời của học sinh..."
 *          }
 *          ```
 *
 *       **Quy trình tự động:**
 *       1. **Validate**: Kiểm tra attempt.status = IN_PROGRESS
 *
 *       2. **Auto-grading MULTIPLE_CHOICE/TRUE_FALSE**:
 *          - Lấy correct_option_ids từ snapshot (Array)
 *          - So sánh với answer_data (normalize thành array)
 *          - Kiểm tra: `sorted(student_answers) == sorted(correct_option_ids)`
 *          - is_correct = true/false
 *          - score = max_score (nếu đúng 100%) hoặc 0
 *
 *       3. **Skip ESSAY/SHORT_ANSWER**: Chấm thủ công sau
 *
 *       4. **Update attempt**:
 *          - submit_time = now
 *          - duration_seconds = (submit_time - start_time) / 1000
 *          - total_score = Σ(score của các câu đã chấm)
 *          - status = SUBMITTED
 *          - is_auto_graded = true
 *
 *       5. **Save student_answers**: Lưu tất cả câu trả lời vào DB
 *
 *       **Lưu ý quan trọng:**
 *       - ❌ KHÔNG GỬI "A", "B", "C", "D" - GỬI UUID của option
 *       - FE tự sinh ABCD dựa trên order_index khi hiển thị
 *       - Nhiều đáp án: GỬI ARRAY ["uuid1", "uuid2"]
 *       - Thiếu/thừa 1 đáp án → SAI hoàn toàn (0 điểm)
 *       - Auto-grading dùng SNAPSHOT → Admin sửa DB không ảnh hưởng
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
router.post(
  "/attempts/:attemptId/submit",
  checkAuth,
  studentExamsController.submitExam
);

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
router.get(
  "/attempts/:attemptId/results",
  checkAuth,
  studentExamsController.getExamResults
);

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
router.get(
  "/need-grading",
  checkAuth,
  studentExamsController.getExamsNeedGrading
);

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
router.post(
  "/answers/:answerId/grade",
  checkAuth,
  studentExamsController.gradeEssayQuestion
);

module.exports = router;
