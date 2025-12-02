const express = require("express");
const router = express.Router();
const careerEvaluationConfigController = require("../../controllers/schools/careerEvaluationConfig.controller");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Career Evaluation Config
 *   description: API cấu hình đánh giá nghề nghiệp (trọng số, ngưỡng, thống kê)
 */

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/weights:
 *   post:
 *     summary: Cấu hình trọng số tiêu chí cho lớp và nghề nghiệp
 *     description: |
 *       Thiết lập trọng số (%) cho từng tiêu chí đánh giá nghề nghiệp.
 *       
 *       **Quy tắc:**
 *       - Tổng tất cả weight PHẢI = 100%
 *       - Mỗi tiêu chí có weight từ 0-100 (integer)
 *       - Tiêu chí quan trọng hơn → weight cao hơn
 *       
 *       **Ví dụ:** Nghề Software Engineer có 4 tiêu chí:
 *       - Tư duy logic: 30% (quan trọng nhất)
 *       - Kỹ năng lập trình: 30%
 *       - Làm việc nhóm: 25%
 *       - Tiếng Anh: 15%
 *       → Tổng = 100% ✓
 *       
 *       **Cách tính điểm có trọng số:**
 *       - Học sinh đánh giá mỗi tiêu chí: 0-10 điểm
 *       - Điểm trọng số = (điểm × weight) / 100
 *       - Tổng điểm = Σ(điểm trọng số)
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - weights
 *             properties:
 *               class_id:
 *                 type: string
 *                 description: ID của lớp học
 *                 example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *               career_id:
 *                 type: string
 *                 description: ID của nghề nghiệp
 *                 example: "career-123-abc"
 *               weights:
 *                 type: array
 *                 description: Danh sách trọng số cho từng tiêu chí (tổng phải = 100)
 *                 items:
 *                   type: object
 *                   required:
 *                     - criteria_id
 *                     - weight
 *                   properties:
 *                     criteria_id:
 *                       type: string
 *                       description: ID tiêu chí đánh giá
 *                       example: "criteria-456-def"
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       description: Trọng số (%) - giá trị nguyên từ 0-100
 *                       example: 25
 *           examples:
 *             example1:
 *               summary: Cấu hình trọng số cho 4 tiêu chí
 *               value:
 *                 class_id: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                 career_id: "career-123-abc"
 *                 weights:
 *                   - criteria_id: "09352b7e-c88e-11f0-afc5-2626c197d041"
 *                     weight: 30
 *                   - criteria_id: "136a34be-c88e-11f0-afc5-2626c197d041"
 *                     weight: 30
 *                   - criteria_id: "1eb661d4-c88e-11f0-afc5-2626c197d041"
 *                     weight: 25
 *                   - criteria_id: "criteria-4"
 *                     weight: 15
 *             example2:
 *               summary: Trọng số đồng đều cho 5 tiêu chí
 *               value:
 *                 class_id: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                 career_id: "career-456-def"
 *                 weights:
 *                   - criteria_id: "criteria-1"
 *                     weight: 20
 *                   - criteria_id: "criteria-2"
 *                     weight: 20
 *                   - criteria_id: "criteria-3"
 *                     weight: 20
 *                   - criteria_id: "criteria-4"
 *                     weight: 20
 *                   - criteria_id: "criteria-5"
 *                     weight: 20
 *     responses:
 *       200:
 *         description: Cấu hình thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     total_weight:
 *                       type: number
 *                     criteria_count:
 *                       type: integer
 *       400:
 *         description: Dữ liệu không hợp lệ (tổng weight ≠ 100)
 *       500:
 *         description: Lỗi server
 */
router.post("/weights", careerEvaluationConfigController.configureCriteriaWeights);

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/weights:
 *   get:
 *     summary: Lấy cấu hình trọng số tiêu chí đã thiết lập
 *     description: |
 *       Truy vấn danh sách trọng số đã cấu hình cho một nghề nghiệp trong lớp học.
 *       
 *       **Response bao gồm:**
 *       - Danh sách tất cả tiêu chí và trọng số tương ứng
 *       - Tổng trọng số (total_weight) → Kiểm tra = 100 hay chưa
 *       - Trạng thái hợp lệ (is_valid) → true nếu tổng = 100
 *       
 *       **Use case:**
 *       - Xem cấu hình hiện tại trước khi chỉnh sửa
 *       - Validate trọng số đã đúng chưa
 *       - Hiển thị cho giáo viên/admin
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *       - in: query
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề nghiệp
 *         example: "career-123-abc"
 *     responses:
 *       200:
 *         description: Danh sách trọng số
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: string
 *                     career_id:
 *                       type: string
 *                     weights:
 *                       type: array
 *                     total_weight:
 *                       type: number
 *                     is_valid:
 *                       type: boolean
 *       400:
 *         description: Thiếu tham số
 *       500:
 *         description: Lỗi server
 */
router.get("/weights", careerEvaluationConfigController.getCriteriaWeights);

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/thresholds:
 *   post:
 *     summary: Cấu hình ngưỡng đánh giá nghề nghiệp
 *     description: |
 *       Thiết lập ngưỡng điểm để phân loại mức độ phù hợp của học sinh với nghề nghiệp.
 *       
 *       **Cách tính điểm:**
 *       - max_score = Số tiêu chí × 10 (VD: 5 tiêu chí → max_score = 50)
 *       
 *       **Phân loại:**
 *       - Điểm ≥ very_suitable_min → **Rất phù hợp**
 *       - suitable_min ≤ Điểm < very_suitable_min → **Phù hợp**
 *       - Điểm < suitable_min → **Không phù hợp**
 *       
 *       **Ví dụ:** Với max_score=50, very_suitable_min=40, suitable_min=30
 *       - Điểm 45/50 → Rất phù hợp (90%)
 *       - Điểm 35/50 → Phù hợp (70%)
 *       - Điểm 25/50 → Không phù hợp (50%)
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - very_suitable_min
 *               - suitable_min
 *             properties:
 *               class_id:
 *                 type: string
 *                 description: ID của lớp học
 *                 example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *               career_id:
 *                 type: string
 *                 description: ID của nghề nghiệp
 *                 example: "career-123-abc"
 *               very_suitable_min:
 *                 type: number
 *                 description: Ngưỡng tối thiểu cho "Rất phù hợp" (điểm tuyệt đối, không phải %)
 *                 example: 40
 *                 minimum: 0
 *               suitable_min:
 *                 type: number
 *                 description: Ngưỡng tối thiểu cho "Phù hợp" (điểm tuyệt đối, phải < very_suitable_min)
 *                 example: 30
 *                 minimum: 0
 *           examples:
 *             example1:
 *               summary: Ngưỡng 80%-60% cho 5 tiêu chí
 *               value:
 *                 class_id: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                 career_id: "career-123-abc"
 *                 very_suitable_min: 40
 *                 suitable_min: 30
 *             example2:
 *               summary: Ngưỡng nghiêm ngặt 90%-70%
 *               value:
 *                 class_id: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                 career_id: "career-456-def"
 *                 very_suitable_min: 45
 *                 suitable_min: 35
 *     responses:
 *       200:
 *         description: Cấu hình thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     class_id:
 *                       type: string
 *                     career_id:
 *                       type: string
 *                     max_score:
 *                       type: number
 *                     very_suitable_min:
 *                       type: number
 *                     suitable_min:
 *                       type: number
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/thresholds", careerEvaluationConfigController.configureEvaluationThresholds);

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/thresholds:
 *   get:
 *     summary: Lấy cấu hình ngưỡng đánh giá đã thiết lập
 *     description: |
 *       Truy vấn ngưỡng phân loại mức độ phù hợp đã cấu hình.
 *       
 *       **Response bao gồm:**
 *       - max_score: Điểm tối đa (số tiêu chí × 10)
 *       - very_suitable_min: Ngưỡng "Rất phù hợp"
 *       - suitable_min: Ngưỡng "Phù hợp"
 *       
 *       **Use case:**
 *       - Hiển thị ngưỡng hiện tại cho admin
 *       - Kiểm tra trước khi học sinh làm bài đánh giá
 *       - Validate cấu hình (very_suitable_min > suitable_min)
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *       - in: query
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề nghiệp
 *         example: "career-123-abc"
 *     responses:
 *       200:
 *         description: Thông tin ngưỡng đánh giá
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     class_id:
 *                       type: string
 *                     career_id:
 *                       type: string
 *                     max_score:
 *                       type: number
 *                     very_suitable_min:
 *                       type: number
 *                     suitable_min:
 *                       type: number
 *       400:
 *         description: Thiếu tham số
 *       500:
 *         description: Lỗi server
 */
router.get("/thresholds", careerEvaluationConfigController.getEvaluationThresholds);

/**
 * @swagger
 * /api/v2/schools/career-evaluation-config/statistics:
 *   get:
 *     summary: Thống kê kết quả đánh giá nghề nghiệp của lớp
 *     description: |
 *       Phân tích tổng quan kết quả đánh giá của toàn bộ học sinh trong lớp.
 *       
 *       **Thống kê bao gồm:**
 *       - Tổng số học sinh đã đánh giá (total_evaluations)
 *       - Phân bổ theo mức độ phù hợp:
 *         + Rất phù hợp: Số lượng + % học sinh
 *         + Phù hợp: Số lượng + %
 *         + Không phù hợp: Số lượng + %
 *       - Điểm trung bình của lớp (average_score)
 *       - Phần trăm trung bình (average_percentage)
 *       
 *       **Use case:**
 *       - Dashboard cho giáo viên/admin
 *       - Đánh giá chất lượng lớp học
 *       - Phát hiện xu hướng nghề nghiệp phù hợp
 *       - So sánh giữa các nghề nghiệp khác nhau
 *       
 *       **Ví dụ output:**
 *       - Lớp có 30 học sinh đánh giá nghề Software Engineer
 *       - Rất phù hợp: 12 học sinh (40%)
 *       - Phù hợp: 10 học sinh (33.3%)
 *       - Không phù hợp: 8 học sinh (26.7%)
 *       - Điểm TB: 36.5/50 (73%)
 *     tags: [V2 - Schools - Career Evaluation Config]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *       - in: query
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề nghiệp
 *         example: "career-123-abc"
 *     responses:
 *       200:
 *         description: Thống kê kết quả
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: string
 *                     career_id:
 *                       type: string
 *                     total_evaluations:
 *                       type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         very_suitable:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: integer
 *                             percentage:
 *                               type: string
 *                         suitable:
 *                           type: object
 *                         not_suitable:
 *                           type: object
 *                     average_score:
 *                       type: string
 *                     average_percentage:
 *                       type: string
 *       400:
 *         description: Thiếu tham số
 *       500:
 *         description: Lỗi server
 */
router.get("/statistics", careerEvaluationConfigController.getEvaluationStatistics);

module.exports = router;
