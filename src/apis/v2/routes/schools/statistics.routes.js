const express = require("express");
const router = express.Router();
const statisticsController = require("../../controllers/schools/statistics.controller");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Statistics
 *   description: API thống kê cho học sinh
 */

/**
 * @swagger
 * /api/v2/schools/statistics/students/{id}/career:
 *   get:
 *     summary: Thống kê nghề nghiệp của học sinh
 *     description: |
 *       Lấy thống kê các nghề nghiệp mà học sinh đang học và tiến độ học tập.
 *       
 *       **Response bao gồm:**
 *       - total_careers: Tổng số nghề nghiệp đang học
 *       - statistics: Mảng thống kê từng nghề nghiệp:
 *         + career_id, career_name, career_code
 *         + total_criteria: Tổng số tiêu chí của nghề
 *         + completed_criteria: Số tiêu chí đã hoàn thành (status = COMPLETED)
 *         + in_progress_criteria: Số tiêu chí đang học (WATCHING, PAUSED, SEEK_ATTEMPT)
 *         + average_progress: Tiến độ trung bình (%) của nghề nghiệp
 *         + criteria_details: Chi tiết từng tiêu chí (tên, tiến độ, trạng thái)
 *       
 *       **Use case:**
 *       - Dashboard học sinh: Hiển thị "Bạn đang học 3 nghề nghiệp"
 *       - Xem tiến độ từng nghề: "Lập trình viên: 75%, Thiết kế đồ họa: 40%"
 *       - Theo dõi các tiêu chí đã hoàn thành và chưa học
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của học sinh
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
 *                   example: Get student career statistics successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     student_id:
 *                       type: string
 *                       example: student-123-abc
 *                     total_careers:
 *                       type: integer
 *                       example: 3
 *                       description: Tổng số nghề nghiệp đang học
 *                     statistics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           career_id:
 *                             type: string
 *                             example: career-456-def
 *                           career_code:
 *                             type: string
 *                             example: IT001
 *                           career_name:
 *                             type: string
 *                             example: Lập trình viên Full-stack
 *                           career_description:
 *                             type: string
 *                             example: Phát triển ứng dụng web từ frontend đến backend
 *                           career_tags:
 *                             type: string
 *                             example: IT,Programming,Web
 *                           total_criteria:
 *                             type: integer
 *                             example: 5
 *                             description: Tổng số tiêu chí của nghề
 *                           completed_criteria:
 *                             type: integer
 *                             example: 3
 *                             description: Số tiêu chí đã hoàn thành
 *                           in_progress_criteria:
 *                             type: integer
 *                             example: 2
 *                             description: Số tiêu chí đang học
 *                           not_started_criteria:
 *                             type: integer
 *                             example: 0
 *                             description: Số tiêu chí chưa bắt đầu
 *                           average_progress:
 *                             type: number
 *                             example: 75.5
 *                             description: Tiến độ trung bình (%) của nghề nghiệp
 *                           criteria_details:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 criteria_id:
 *                                   type: string
 *                                   example: criteria-789-ghi
 *                                 criteria_name:
 *                                   type: string
 *                                   example: Phát triển Frontend
 *                                 criteria_description:
 *                                   type: string
 *                                   example: Học HTML, CSS, JavaScript, React
 *                                 criteria_order_index:
 *                                   type: integer
 *                                   example: 1
 *                                 progress_percent:
 *                                   type: number
 *                                   example: 85
 *                                 last_watched_position:
 *                                   type: number
 *                                   example: 120.5
 *                                   description: Vị trí video cuối cùng (giây)
 *                                 status:
 *                                   type: string
 *                                   enum: [WATCHING, PAUSED, SEEK_ATTEMPT, COMPLETED, EXIT]
 *                                   example: COMPLETED
 *                                 last_updated:
 *                                   type: string
 *                                   format: date-time
 *       400:
 *         description: Student ID không hợp lệ
 *       404:
 *         description: Học sinh không tồn tại
 */
router.get("/students/:id/career", checkAuth, statisticsController.getStudentCareerStatistics);

/**
 * @swagger
 * /api/v2/schools/statistics/students/{id}/evaluations:
 *   get:
 *     summary: Thống kê đánh giá nghề nghiệp của học sinh
 *     description: |
 *       Lấy danh sách các nghề nghiệp mà học sinh đã đánh giá, bao gồm:
 *       - Thông tin nghề nghiệp
 *       - Điểm đánh giá từng tiêu chí
 *       - Kết quả tổng hợp (điểm trọng số, phần trăm)
 *       - Kết luận phù hợp (VERY_SUITABLE, SUITABLE, NOT_SUITABLE)
 *       
 *       **Use case:**
 *       - Xem lại các nghề đã đánh giá
 *       - Phân tích điểm mạnh/yếu theo từng tiêu chí
 *       - So sánh kết quả đánh giá giữa các nghề
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của học sinh
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
 *                   example: Get student career evaluations successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     student_id:
 *                       type: string
 *                       example: student-123-abc
 *                     total_evaluations:
 *                       type: integer
 *                       example: 3
 *                       description: Tổng số lần đánh giá
 *                     evaluations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           evaluation_id:
 *                             type: string
 *                             example: eval-001-xyz
 *                           career_id:
 *                             type: string
 *                             example: career-456-def
 *                           career_code:
 *                             type: string
 *                             example: IT001
 *                           career_name:
 *                             type: string
 *                             example: Lập trình viên
 *                           career_description:
 *                             type: string
 *                             example: Phát triển phần mềm
 *                           class_id:
 *                             type: string
 *                             example: class-789-ghi
 *                           class_name:
 *                             type: string
 *                             example: 10A1
 *                           criteria_scores:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 criteria_id:
 *                                   type: string
 *                                   example: criteria-111-aaa
 *                                 criteria_name:
 *                                   type: string
 *                                   example: Tư duy logic
 *                                 criteria_description:
 *                                   type: string
 *                                   example: Khả năng phân tích và giải quyết vấn đề
 *                                 criteria_order_index:
 *                                   type: integer
 *                                   example: 1
 *                                 score:
 *                                   type: number
 *                                   example: 8
 *                                   description: Điểm tự đánh giá (1-10)
 *                           total_criteria:
 *                             type: integer
 *                             example: 5
 *                           weighted_score:
 *                             type: number
 *                             example: 42.5
 *                             description: Điểm sau khi áp dụng trọng số
 *                           max_score:
 *                             type: number
 *                             example: 50
 *                             description: Điểm tối đa có thể đạt
 *                           percentage:
 *                             type: number
 *                             example: 85.0
 *                             description: Phần trăm phù hợp
 *                           evaluation_result:
 *                             type: string
 *                             enum: [VERY_SUITABLE, SUITABLE, NOT_SUITABLE]
 *                             example: VERY_SUITABLE
 *                             description: Kết luận mức độ phù hợp
 *                           notes:
 *                             type: string
 *                             example: Học sinh có năng khiếu
 *                           evaluated_at:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Student ID không hợp lệ
 *       404:
 *         description: Học sinh không tồn tại
 */
router.get("/students/:id/evaluations", checkAuth, statisticsController.getStudentCareerEvaluations);

/**
 * @swagger
 * /api/v2/schools/statistics/classes/{id}/overview:
 *   get:
 *     summary: Thống kê tổng quan theo lớp
 *     description: |
 *       Lấy thông tin tổng quan về lớp học bao gồm:
 *       
 *       **Thống kê bao gồm:**
 *       - Tổng số học sinh trong lớp
 *       - Phân bổ giới tính:
 *         + Số lượng nam/nữ/khác
 *         + Phần trăm từng giới tính
 *       - Số nghề được giao học (từ class_criteria_config)
 *         + Tổng số nghề
 *         + Danh sách chi tiết các nghề
 *       
 *       **Use case:**
 *       - Dashboard tổng quan lớp học cho giáo viên
 *       - Báo cáo thống kê ban đầu
 *       - Hiển thị cơ cấu lớp học
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
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
 *                   example: Get class overview statistics successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: string
 *                       example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                     class_name:
 *                       type: string
 *                       example: "10A1"
 *                       description: Tên lớp học
 *                     total_students:
 *                       type: integer
 *                       example: 35
 *                       description: Tổng số học sinh trong lớp
 *                     gender_distribution:
 *                       type: object
 *                       properties:
 *                         male:
 *                           type: integer
 *                           example: 18
 *                           description: Số học sinh nam
 *                         female:
 *                           type: integer
 *                           example: 15
 *                           description: Số học sinh nữ
 *                         other:
 *                           type: integer
 *                           example: 2
 *                           description: Số học sinh giới tính khác/chưa cập nhật
 *                         male_percentage:
 *                           type: string
 *                           example: "51.43"
 *                           description: Phần trăm học sinh nam
 *                         female_percentage:
 *                           type: string
 *                           example: "42.86"
 *                           description: Phần trăm học sinh nữ
 *                         other_percentage:
 *                           type: string
 *                           example: "5.71"
 *                           description: Phần trăm học sinh giới tính khác
 *                     assigned_careers:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 8
 *                           description: Tổng số nghề được giao học
 *                         careers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "100ae3c0-c307-11f0-afc5-2626c197d041"
 *                               code:
 *                                 type: string
 *                                 example: "IT001"
 *                               name:
 *                                 type: string
 *                                 example: "Lập trình viên"
 *       400:
 *         description: Class ID không hợp lệ
 *       404:
 *         description: Lớp học không tồn tại
 */
router.get("/classes/:id/overview", checkAuth, statisticsController.getClassOverviewStatistics);

/**
 * @swagger
 * /api/v2/schools/statistics/classes/{id}/career-progress:
 *   get:
 *     summary: Thống kê danh sách nghề của lớp và tiến độ trung bình
 *     description: |
 *       Lấy thống kê tiến độ học tập của lớp theo từng nghề nghiệp:
 *       - Danh sách tất cả nghề được giao cho lớp
 *       - Tiến độ trung bình (average progress %) của tất cả học sinh
 *       - Số học sinh đã hoàn thành/đang học/chưa bắt đầu mỗi nghề
 *       - Số tiêu chí của mỗi nghề
 *       
 *       **Use case:**
 *       - Giáo viên xem tổng quan tiến độ học của cả lớp
 *       - Phát hiện nghề nào học sinh học tốt/kém
 *       - Đưa ra kế hoạch hỗ trợ cho các nghề có tiến độ thấp
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
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
 *                   example: Get class career progress successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: string
 *                       example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                     class_name:
 *                       type: string
 *                       example: "10A1"
 *                       description: Tên lớp học
 *                     total_careers:
 *                       type: integer
 *                       example: 8
 *                       description: Tổng số nghề được giao
 *                     careers_progress:
 *                       type: array
 *                       description: Danh sách nghề với tiến độ (sắp xếp theo average_progress giảm dần)
 *                       items:
 *                         type: object
 *                         properties:
 *                           career_id:
 *                             type: string
 *                             example: "100ae3c0-c307-11f0-afc5-2626c197d041"
 *                           career_code:
 *                             type: string
 *                             example: "IT001"
 *                           career_name:
 *                             type: string
 *                             example: "Lập trình viên"
 *                           career_description:
 *                             type: string
 *                             example: "Phát triển phần mềm và ứng dụng"
 *                           total_criteria:
 *                             type: integer
 *                             example: 5
 *                             description: Số tiêu chí của nghề này
 *                           students_enrolled:
 *                             type: integer
 *                             example: 28
 *                             description: Số học sinh đã có tiến độ học (đã bắt đầu học)
 *                           average_progress:
 *                             type: number
 *                             example: 67.45
 *                             description: Tiến độ trung bình (%) của tất cả học sinh trong nghề này
 *                           completion_stats:
 *                             type: object
 *                             description: Phân loại học sinh theo trạng thái học
 *                             properties:
 *                               completed:
 *                                 type: integer
 *                                 example: 8
 *                                 description: Số học sinh đã hoàn thành (100%)
 *                               in_progress:
 *                                 type: integer
 *                                 example: 20
 *                                 description: Số học sinh đang học (WATCHING, PAUSED, SEEK_ATTEMPT)
 *                               not_started:
 *                                 type: integer
 *                                 example: 2
 *                                 description: Số học sinh chưa bắt đầu hoặc đã thoát
 *       400:
 *         description: Class ID không hợp lệ
 *       404:
 *         description: Lớp học không tồn tại
 */
router.get("/classes/:id/career-progress", checkAuth, statisticsController.getClassCareerProgress);

/**
 * @swagger
 * /api/v2/schools/statistics/classes/{id}/career-evaluations:
 *   get:
 *     summary: Thống kê kết quả đánh giá nghề nghiệp trung bình của lớp
 *     description: |
 *       Lấy thống kê kết quả tự đánh giá nghề nghiệp của toàn lớp:
 *       - Điểm trung bình (weighted score, percentage) mỗi nghề
 *       - Phân loại học sinh theo kết quả (VERY_SUITABLE, SUITABLE, NOT_SUITABLE)
 *       - Điểm trung bình từng tiêu chí của mỗi nghề
 *       - Số học sinh đã/chưa đánh giá
 *       
 *       **Use case:**
 *       - Giáo viên xem nghề nào phù hợp với đa số học sinh
 *       - Tư vấn hướng nghiệp dựa trên kết quả đánh giá tập thể
 *       - Phát hiện nghề có nhiều học sinh đánh giá NOT_SUITABLE
 *       - Phân tích điểm mạnh/yếu theo từng tiêu chí
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
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
 *                   example: Get class career evaluations successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: string
 *                       example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                     class_name:
 *                       type: string
 *                       example: "10A1"
 *                     total_students:
 *                       type: integer
 *                       example: 30
 *                       description: Tổng số học sinh trong lớp
 *                     total_evaluated_students:
 *                       type: integer
 *                       example: 28
 *                       description: Số học sinh đã đánh giá ít nhất 1 nghề
 *                     careers_evaluation_summary:
 *                       type: array
 *                       description: Danh sách nghề với kết quả đánh giá (sắp xếp theo average_percentage giảm dần)
 *                       items:
 *                         type: object
 *                         properties:
 *                           career_id:
 *                             type: string
 *                             example: "100ae3c0-c307-11f0-afc5-2626c197d041"
 *                           career_code:
 *                             type: string
 *                             example: "IT001"
 *                           career_name:
 *                             type: string
 *                             example: "Lập trình viên"
 *                           career_description:
 *                             type: string
 *                             example: "Phát triển phần mềm và ứng dụng"
 *                           total_evaluations:
 *                             type: integer
 *                             example: 28
 *                             description: Số học sinh đã đánh giá nghề này
 *                           average_weighted_score:
 *                             type: number
 *                             example: 42.5
 *                             description: Điểm trọng số trung bình
 *                           average_max_score:
 *                             type: number
 *                             example: 50
 *                             description: Điểm tối đa trung bình
 *                           average_percentage:
 *                             type: number
 *                             example: 85.0
 *                             description: Phần trăm phù hợp trung bình
 *                           evaluation_distribution:
 *                             type: object
 *                             description: Phân loại học sinh theo kết quả đánh giá
 *                             properties:
 *                               very_suitable:
 *                                 type: integer
 *                                 example: 12
 *                                 description: Số học sinh có kết quả VERY_SUITABLE
 *                               suitable:
 *                                 type: integer
 *                                 example: 14
 *                                 description: Số học sinh có kết quả SUITABLE
 *                               not_suitable:
 *                                 type: integer
 *                                 example: 2
 *                                 description: Số học sinh có kết quả NOT_SUITABLE
 *                               not_evaluated:
 *                                 type: integer
 *                                 example: 2
 *                                 description: Số học sinh chưa đánh giá nghề này
 *                           criteria_scores:
 *                             type: array
 *                             description: Điểm trung bình từng tiêu chí
 *                             items:
 *                               type: object
 *                               properties:
 *                                 criteria_id:
 *                                   type: string
 *                                   example: "09352b7e-c88e-11f0-afc5-2626c197d041"
 *                                 criteria_name:
 *                                   type: string
 *                                   example: "Tư duy logic"
 *                                 criteria_order_index:
 *                                   type: integer
 *                                   example: 1
 *                                 average_score:
 *                                   type: number
 *                                   example: 8.5
 *                                   description: Điểm trung bình tiêu chí này
 *                                 min_score:
 *                                   type: number
 *                                   example: 5
 *                                   description: Điểm thấp nhất
 *                                 max_score:
 *                                   type: number
 *                                   example: 10
 *                                   description: Điểm cao nhất
 *       400:
 *         description: Class ID không hợp lệ
 *       404:
 *         description: Lớp học không tồn tại
 */
router.get("/classes/:id/career-evaluations", checkAuth, statisticsController.getClassCareerEvaluations);

/**
 * @swagger
 * /api/v2/schools/statistics/classes/{id}/top-students:
 *   get:
 *     summary: Thống kê top học sinh theo tiến độ hoàn thành (Overall)
 *     description: |
 *       Xếp hạng học sinh trong lớp dựa trên tiến độ học tập các nghề:
 *       - **Tiêu chí xếp hạng (ưu tiên theo thứ tự):**
 *         1. Số tiêu chí hoàn thành (criteria completed) - cao hơn → xếp trước
 *         2. Tiến độ trung bình tổng thể (overall progress %) - cao hơn → xếp trước
 *         3. Số nghề hoàn thành (careers completed) - nhiều hơn → xếp trước
 *       
 *       - **Thông tin trả về:**
 *         - Xếp hạng (rank 1, 2, 3...)
 *         - Thông tin học sinh (tên, avatar, giới tính)
 *         - Overall progress % (trung bình tất cả tiêu chí)
 *         - Số tiêu chí/nghề đã hoàn thành
 *         - Chi tiết tiến độ từng nghề (breakdown)
 *       
 *       **Use case:**
 *       - Giáo viên khen thưởng học sinh xuất sắc
 *       - Hiển thị bảng xếp hạng trên dashboard
 *       - Tạo động lực cạnh tranh tích cực giữa học sinh
 *       - Báo cáo định kỳ về thành tích học tập
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Số lượng học sinh trong top (default 10)
 *         example: 10
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
 *                   example: Get class top students successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: string
 *                       example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                     class_name:
 *                       type: string
 *                       example: "10A1"
 *                     total_students:
 *                       type: integer
 *                       example: 30
 *                       description: Tổng số học sinh trong lớp
 *                     ranking_type:
 *                       type: string
 *                       example: "overall"
 *                       description: Loại xếp hạng (overall = tổng thể)
 *                     ranking_criteria:
 *                       type: string
 *                       example: "criteria_completed_first"
 *                       description: Tiêu chí xếp hạng ưu tiên (tiêu chí hoàn thành → overall progress → nghề hoàn thành)
 *                     top_students:
 *                       type: array
 *                       description: Danh sách top học sinh (sắp xếp theo rank)
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                             example: 1
 *                             description: Thứ hạng
 *                           student_id:
 *                             type: string
 *                             example: "422bc9e1-cdb7-11f0-afc5-2626c197d041"
 *                           student_code:
 *                             type: string
 *                             example: "HS001"
 *                           student_name:
 *                             type: string
 *                             example: "Nguyễn Văn A"
 *                           student_avatar:
 *                             type: string
 *                             example: "https://example.com/avatar.jpg"
 *                             nullable: true
 *                             description: Avatar học sinh (hiện tại null - chưa có trong schema)
 *                           gender:
 *                             type: string
 *                             example: "MALE"
 *                             enum: [MALE, FEMALE, OTHER]
 *                           overall_progress:
 *                             type: number
 *                             example: 95.5
 *                             description: Tiến độ trung bình tổng thể (%)
 *                           total_criteria_completed:
 *                             type: integer
 *                             example: 45
 *                             description: Tổng số tiêu chí đã hoàn thành
 *                           total_criteria_assigned:
 *                             type: integer
 *                             example: 50
 *                             description: Tổng số tiêu chí được giao
 *                           careers_completed:
 *                             type: integer
 *                             example: 8
 *                             description: Số nghề đã hoàn thành 100%
 *                           careers_in_progress:
 *                             type: integer
 *                             example: 2
 *                             description: Số nghề đang học
 *                           total_careers_assigned:
 *                             type: integer
 *                             example: 10
 *                             description: Tổng số nghề được giao cho lớp
 *                           breakdown:
 *                             type: array
 *                             description: Chi tiết tiến độ từng nghề
 *                             items:
 *                               type: object
 *                               properties:
 *                                 career_id:
 *                                   type: string
 *                                   example: "100ae3c0-c307-11f0-afc5-2626c197d041"
 *                                 career_code:
 *                                   type: string
 *                                   example: "IT001"
 *                                 career_name:
 *                                   type: string
 *                                   example: "Lập trình viên"
 *                                 progress:
 *                                   type: number
 *                                   example: 100
 *                                   description: Tiến độ nghề này (%)
 *                                 completed_criteria:
 *                                   type: integer
 *                                   example: 5
 *                                 total_criteria:
 *                                   type: integer
 *                                   example: 5
 *                                 status:
 *                                   type: string
 *                                   example: "COMPLETED"
 *                                   enum: [COMPLETED, IN_PROGRESS, NOT_STARTED]
 *       400:
 *         description: Class ID không hợp lệ hoặc limit không hợp lệ
 *       404:
 *         description: Lớp học không tồn tại
 */
router.get("/classes/:id/top-students", checkAuth, statisticsController.getClassTopStudents);

/**
 * @swagger
 * /api/v2/schools/statistics/classes/{id}/overall-completion:
 *   get:
 *     summary: Thống kê % trung bình hoàn thành học tập nghề của lớp
 *     description: |
 *       Tính toán các chỉ số tổng hợp về tiến độ học tập của toàn lớp:
 *       - **Average Progress %**: Trung bình % tiến độ của tất cả học sinh trên tất cả tiêu chí
 *       - **Overall Completion %**: % tiêu chí đã hoàn thành so với tổng số tiêu chí phải học
 *       - **Completion Rate**: Tỷ lệ hoàn thành (0-1)
 *       
 *       **Công thức:**
 *       - Total possible = (số học sinh) × (số tiêu chí được giao)
 *       - Average progress % = (tổng progress của tất cả học sinh trên tất cả tiêu chí) / total possible
 *       - Overall completion % = (số tiêu chí đã hoàn thành 100%) / total possible × 100
 *       
 *       **Use case:**
 *       - Dashboard tổng quan hiệu suất lớp
 *       - Báo cáo định kỳ cho ban giám hiệu
 *       - So sánh tiến độ giữa các lớp
 *       - Đánh giá hiệu quả giảng dạy
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
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
 *                   example: Get class overall completion successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: string
 *                       example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                     class_name:
 *                       type: string
 *                       example: "10A1"
 *                     total_students:
 *                       type: integer
 *                       example: 30
 *                       description: Tổng số học sinh trong lớp
 *                     total_careers_assigned:
 *                       type: integer
 *                       example: 8
 *                       description: Số nghề được giao cho lớp
 *                     total_criteria_assigned:
 *                       type: integer
 *                       example: 40
 *                       description: Tổng số tiêu chí được giao (tất cả nghề)
 *                     overall_completion_percentage:
 *                       type: number
 *                       example: 65.5
 *                       description: "% hoàn thành tổng thể: (số tiêu chí completed) / (total students × total criteria) × 100"
 *                     average_progress_percentage:
 *                       type: number
 *                       example: 72.3
 *                       description: "% tiến độ trung bình: (tổng progress của tất cả) / (total students × total criteria)"
 *                     total_criteria_completed:
 *                       type: integer
 *                       example: 786
 *                       description: Tổng số tiêu chí đã hoàn thành 100% (tất cả học sinh)
 *                     completion_rate:
 *                       type: number
 *                       example: 0.655
 *                       description: Tỷ lệ hoàn thành (0-1)
 *                     careers_detail:
 *                       type: array
 *                       description: Chi tiết % hoàn thành từng nghề (sắp xếp theo average_progress giảm dần)
 *                       items:
 *                         type: object
 *                         properties:
 *                           career_id:
 *                             type: string
 *                             example: "100ae3c0-c307-11f0-afc5-2626c197d041"
 *                           career_code:
 *                             type: string
 *                             example: "IT001"
 *                           career_name:
 *                             type: string
 *                             example: "Lập trình viên"
 *                           total_criteria:
 *                             type: integer
 *                             example: 5
 *                             description: Số tiêu chí của nghề này
 *                           average_progress_percentage:
 *                             type: number
 *                             example: 75.5
 *                             description: "% tiến độ trung bình của nghề này: (tổng progress) / (số HS × số tiêu chí)"
 *                           completion_percentage:
 *                             type: number
 *                             example: 68.0
 *                             description: "% hoàn thành của nghề này: (tiêu chí completed) / (số HS × số tiêu chí) × 100"
 *                           total_criteria_completed:
 *                             type: integer
 *                             example: 102
 *                             description: Tổng số tiêu chí đã hoàn thành trong nghề này (tất cả học sinh)
 *                           total_possible:
 *                             type: integer
 *                             example: 150
 *                             description: Tổng số tiêu chí có thể hoàn thành (số học sinh × số tiêu chí nghề)
 *       400:
 *         description: Class ID không hợp lệ
 *       404:
 *         description: Lớp học không tồn tại
 */
router.get("/classes/:id/overall-completion", checkAuth, statisticsController.getClassOverallCompletion);

/**
 * @swagger
 * /api/v2/schools/statistics/schools/{id}/overview:
 *   get:
 *     summary: Thống kê tổng quan theo trường
 *     description: |
 *       Lấy thông tin tổng quan về học sinh trong trường:
 *       - Tổng số học sinh và số lớp
 *       - Phân bổ theo giới tính (số lượng và %)
 *       - Phân bổ theo khối lớp (grade level)
 *       - Chi tiết giới tính trong từng khối
 *       
 *       **Use case:**
 *       - Dashboard tổng quan toàn trường
 *       - Báo cáo thống kê cho ban giám hiệu
 *       - Phân tích cơ cấu học sinh
 *       - Lập kế hoạch tuyển sinh
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trường học
 *         example: "school-uuid-123"
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
 *                   example: Get school overview statistics successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     school_id:
 *                       type: string
 *                       example: "school-uuid-123"
 *                     school_name:
 *                       type: string
 *                       example: "Trường THPT Nguyễn Huệ"
 *                     school_address:
 *                       type: string
 *                       example: "123 Đường ABC, Quận 1, TP.HCM"
 *                     total_students:
 *                       type: integer
 *                       example: 1200
 *                       description: Tổng số học sinh toàn trường
 *                     total_classes:
 *                       type: integer
 *                       example: 40
 *                       description: Tổng số lớp
 *                     gender_distribution:
 *                       type: object
 *                       description: Phân bổ giới tính toàn trường
 *                       properties:
 *                         male:
 *                           type: integer
 *                           example: 580
 *                         female:
 *                           type: integer
 *                           example: 610
 *                         other:
 *                           type: integer
 *                           example: 10
 *                         male_percentage:
 *                           type: number
 *                           example: 48.33
 *                         female_percentage:
 *                           type: number
 *                           example: 50.83
 *                         other_percentage:
 *                           type: number
 *                           example: 0.84
 *                     grade_distribution:
 *                       type: array
 *                       description: Phân bổ theo khối lớp (sắp xếp theo grade_level tăng dần)
 *                       items:
 *                         type: object
 *                         properties:
 *                           grade_level:
 *                             type: integer
 *                             example: 10
 *                             description: Khối lớp (10, 11, 12)
 *                           total_students:
 *                             type: integer
 *                             example: 400
 *                             description: Tổng số học sinh khối này
 *                           male:
 *                             type: integer
 *                             example: 195
 *                           female:
 *                             type: integer
 *                             example: 200
 *                           other:
 *                             type: integer
 *                             example: 5
 *       400:
 *         description: School ID không hợp lệ
 *       404:
 *         description: Trường học không tồn tại
 */
router.get("/schools/:id/overview", checkAuth, statisticsController.getSchoolOverviewStatistics);

/**
 * @swagger
 * /api/v2/schools/statistics/schools/{id}/licensed-careers:
 *   get:
 *     summary: Lấy danh sách nghề mà trường đang được cấp phép
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *     responses:
 *       200:
 *         description: Danh sách nghề được cấp phép thành công
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
 *                     school_id:
 *                       type: string
 *                       example: "school-uuid"
 *                     total_licensed_careers:
 *                       type: integer
 *                       example: 15
 *                     careers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           license_id:
 *                             type: string
 *                             example: "license-uuid"
 *                           career_id:
 *                             type: string
 *                             example: "career-uuid"
 *                           career_code:
 *                             type: string
 *                             example: "IT01"
 *                           career_name:
 *                             type: string
 *                             example: "Lập trình viên"
 *                           career_description:
 *                             type: string
 *                             example: "Nghề lập trình phần mềm"
 *                           career_tags:
 *                             type: string
 *                             example: "IT,Programming,Software"
 *                           is_career_active:
 *                             type: boolean
 *                             example: true
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-01T00:00:00Z"
 *                           expiry_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-12-31T23:59:59Z"
 *                           licensed_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-01T00:00:00Z"
 *       400:
 *         description: Missing school_id
 *       500:
 *         description: Server error
 */
router.get(
  '/schools/:id/licensed-careers',
  checkAuth,
  statisticsController.getSchoolLicensedCareers
);

/**
 * @swagger
 * /api/v2/schools/statistics/schools/{id}/careers-in-use:
 *   get:
 *     summary: Lấy danh sách nghề đang được sử dụng trong trường
 *     description: |
 *       Thống kê các nghề đang được sử dụng dựa trên:
 *       - Số lượng học sinh tham gia (có tiến độ học tập)
 *       - Số lượng đánh giá của học sinh
 *       - Điểm đánh giá trung bình
 *       - Phân loại kết quả đánh giá
 *       
 *       **Hỗ trợ sắp xếp theo:**
 *       - students_count: Số học sinh tham gia (mặc định)
 *       - evaluations_count: Số lượng đánh giá
 *       - average_score: Điểm trung bình
 *       
 *       **Use case:**
 *       - Xem nghề nào được học sinh quan tâm nhất
 *       - Phân tích hiệu quả sử dụng nghề đã cấp phép
 *       - Lập kế hoạch đào tạo dựa trên mức độ sử dụng
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *         example: "school-uuid-123"
 *       - in: query
 *         name: sort_by
 *         required: false
 *         schema:
 *           type: string
 *           enum: [students_count, evaluations_count, average_score]
 *           default: students_count
 *         description: Tiêu chí sắp xếp
 *         example: "students_count"
 *       - in: query
 *         name: order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp (asc = tăng dần, desc = giảm dần)
 *         example: "desc"
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
 *                     school_id:
 *                       type: string
 *                       example: "school-uuid-123"
 *                     total_careers_in_use:
 *                       type: integer
 *                       example: 12
 *                       description: Tổng số nghề đang được sử dụng
 *                     sort_by:
 *                       type: string
 *                       example: "students_count"
 *                       description: Tiêu chí sắp xếp đã áp dụng
 *                     order:
 *                       type: string
 *                       example: "desc"
 *                       description: Thứ tự sắp xếp đã áp dụng
 *                     careers:
 *                       type: array
 *                       description: Danh sách nghề (đã sắp xếp)
 *                       items:
 *                         type: object
 *                         properties:
 *                           career_id:
 *                             type: string
 *                             example: "career-uuid-456"
 *                           career_code:
 *                             type: string
 *                             example: "IT001"
 *                           career_name:
 *                             type: string
 *                             example: "Lập trình viên"
 *                           career_description:
 *                             type: string
 *                             example: "Phát triển phần mềm"
 *                           career_tags:
 *                             type: string
 *                             example: "IT,Programming,Software"
 *                           students_count:
 *                             type: integer
 *                             example: 450
 *                             description: Số học sinh đã tham gia học nghề này
 *                           evaluations_count:
 *                             type: integer
 *                             example: 380
 *                             description: Số lượng đánh giá của học sinh
 *                           average_score:
 *                             type: number
 *                             example: 78.5
 *                             description: Điểm đánh giá trung bình (%)
 *                           evaluation_distribution:
 *                             type: object
 *                             description: Phân loại kết quả đánh giá
 *                             properties:
 *                               very_suitable:
 *                                 type: integer
 *                                 example: 150
 *                                 description: Số học sinh đánh giá rất phù hợp
 *                               suitable:
 *                                 type: integer
 *                                 example: 200
 *                                 description: Số học sinh đánh giá phù hợp
 *                               not_suitable:
 *                                 type: integer
 *                                 example: 30
 *                                 description: Số học sinh đánh giá không phù hợp
 *       400:
 *         description: Missing school_id hoặc tham số không hợp lệ
 *       500:
 *         description: Server error
 */
router.get(
  '/schools/:id/careers-in-use',
  checkAuth,
  statisticsController.getSchoolCareersInUse
);

/**
 * @swagger
 * /api/v2/schools/statistics/schools/{id}/grade-completion:
 *   get:
 *     summary: Thống kê % trung bình hoàn thành học tập nghề theo khối lớp
 *     description: |
 *       Tính toán và nhóm thống kê hoàn thành theo khối (grade_level) để hiển thị bar chart:
 *       
 *       **Logic tính toán:**
 *       1. Tính % hoàn thành trung bình của mỗi học sinh
 *       2. Từ đó tính % trung bình của lớp với 1 nghề
 *       3. Tính % trung bình của toàn lớp (tất cả nghề)
 *       4. Nhóm các lớp theo khối (10, 11, 12)
 *       5. Tính % trung bình của từng khối (weighted average theo số học sinh)
 *       
 *       **Dữ liệu trả về:**
 *       - Thống kê tổng thể của trường
 *       - Thống kê theo từng khối (10, 11, 12)
 *       - Chi tiết từng lớp trong khối (nếu cần)
 *       
 *       **Use case:**
 *       - Hiển thị bar chart so sánh % hoàn thành giữa các khối
 *       - Báo cáo tiến độ học tập theo khối
 *       - Phân tích hiệu quả đào tạo theo khối lớp
 *     tags: [V2 - Schools - Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *         example: "school-uuid-123"
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
 *                     school_id:
 *                       type: string
 *                       example: "school-uuid-123"
 *                     total_classes:
 *                       type: integer
 *                       example: 36
 *                       description: Tổng số lớp trong trường
 *                     total_students:
 *                       type: integer
 *                       example: 1080
 *                       description: Tổng số học sinh trong trường
 *                     overall_average_completion:
 *                       type: number
 *                       example: 68.5
 *                       description: "% hoàn thành trung bình của toàn trường"
 *                     overall_completion_rate:
 *                       type: number
 *                       example: 0.6234
 *                       description: Tỉ lệ hoàn thành tổng thể (0-1)
 *                     grade_statistics:
 *                       type: array
 *                       description: Thống kê theo từng khối (sắp xếp theo grade_level)
 *                       items:
 *                         type: object
 *                         properties:
 *                           grade_level:
 *                             type: integer
 *                             example: 10
 *                             description: Khối lớp (10, 11, 12)
 *                           total_classes:
 *                             type: integer
 *                             example: 12
 *                             description: Số lớp trong khối này
 *                           total_students:
 *                             type: integer
 *                             example: 360
 *                             description: Tổng số học sinh trong khối
 *                           average_completion_percentage:
 *                             type: number
 *                             example: 72.3
 *                             description: "% hoàn thành trung bình của khối (weighted average)"
 *                           completion_rate:
 *                             type: number
 *                             example: 0.6543
 *                             description: Tỉ lệ hoàn thành của khối (0-1)
 *                           classes_detail:
 *                             type: array
 *                             description: Chi tiết từng lớp trong khối (sắp xếp theo % hoàn thành giảm dần)
 *                             items:
 *                               type: object
 *                               properties:
 *                                 class_id:
 *                                   type: string
 *                                   example: "class-uuid-456"
 *                                 class_name:
 *                                   type: string
 *                                   example: "10A1"
 *                                 grade_level:
 *                                   type: integer
 *                                   example: 10
 *                                 total_students:
 *                                   type: integer
 *                                   example: 30
 *                                 total_criteria_assigned:
 *                                   type: integer
 *                                   example: 40
 *                                   description: Tổng số tiêu chí được giao cho lớp
 *                                 average_completion_percentage:
 *                                   type: number
 *                                   example: 75.5
 *                                   description: "% hoàn thành trung bình của lớp"
 *                                 total_criteria_completed:
 *                                   type: integer
 *                                   example: 906
 *                                   description: Tổng số tiêu chí đã hoàn thành (tất cả học sinh)
 *                                 total_possible:
 *                                   type: integer
 *                                   example: 1200
 *                                   description: Tổng số tiêu chí có thể hoàn thành (students × criteria)
 *       400:
 *         description: Missing school_id
 *       500:
 *         description: Server error
 */
router.get(
  '/schools/:id/grade-completion',
  checkAuth,
  statisticsController.getSchoolGradeCompletion
);

module.exports = router;
