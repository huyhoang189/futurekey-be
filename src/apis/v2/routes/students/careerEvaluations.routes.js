const express = require("express");
const router = express.Router();
const careerEvaluationsController = require("../../controllers/students/careerEvaluations.controller");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: V2 - Students - Career Evaluations
 *   description: API đánh giá nghề nghiệp cho học sinh
 */

/**
 * @swagger
 * /api/v2/students/career-evaluations/submit:
 *   post:
 *     summary: Học sinh nộp bài đánh giá nghề nghiệp
 *     description: |
 *       Học sinh tự đánh giá mức độ phù hợp của bản thân với một nghề nghiệp.
 *       
 *       **Quy trình:**
 *       1. Học sinh chấm điểm cho từng tiêu chí (0-10 điểm)
 *       2. Hệ thống tính điểm trọng số theo cấu hình của giáo viên
 *       3. Phân loại kết quả theo ngưỡng (Rất phù hợp/Phù hợp/Không phù hợp)
 *       4. Trả về kết quả chi tiết với breakdown từng tiêu chí
 *       
 *       **Công thức tính điểm:**
 *       - Điểm thô: Học sinh tự chấm (0-10)
 *       - Điểm trọng số = (điểm thô × weight) / 100
 *       - Tổng điểm = Σ(điểm trọng số)
 *       - Phần trăm = (tổng điểm / max_score) × 100
 *       
 *       **Ví dụ:** Nghề Software Engineer (4 tiêu chí, max=40)
 *       - Tư duy logic: 8/10 (weight 30%) → 2.4 điểm
 *       - Lập trình: 7/10 (weight 30%) → 2.1 điểm
 *       - Làm việc nhóm: 9/10 (weight 25%) → 2.25 điểm
 *       - Tiếng Anh: 6/10 (weight 15%) → 0.9 điểm
 *       → Tổng: 7.65/10 (76.5%) → Kết quả: Phù hợp
 *       
 *       **Lưu ý:**
 *       - Mỗi học sinh chỉ nộp 1 lần cho mỗi (class_id, career_id)
 *       - Nếu nộp lại sẽ ghi đè (upsert)
 *       - student_id: Optional - nếu không truyền sẽ tự lấy từ user đăng nhập
 *     tags: [V2 - Students - Career Evaluations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - scores
 *             properties:
 *               student_id:
 *                 type: string
 *                 description: ID của học sinh (Optional - nếu không truyền sẽ lấy từ user đăng nhập)
 *                 example: "422bc9e1-cdb7-11f0-afc5-2626c197d041"
 *               class_id:
 *                 type: string
 *                 description: ID của lớp học
 *                 example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *               career_id:
 *                 type: string
 *                 description: ID của nghề nghiệp muốn đánh giá
 *                 example: "career-123-abc"
 *               scores:
 *                 type: array
 *                 description: Danh sách điểm tự đánh giá cho từng tiêu chí
 *                 items:
 *                   type: object
 *                   required:
 *                     - criteria_id
 *                     - score
 *                   properties:
 *                     criteria_id:
 *                       type: string
 *                       description: ID tiêu chí đánh giá
 *                       example: "09352b7e-c88e-11f0-afc5-2626c197d041"
 *                     score:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 10
 *                       description: Điểm tự đánh giá (0-10, có thể là số thực)
 *                       example: 8.5
 *               notes:
 *                 type: string
 *                 description: Ghi chú của học sinh (optional)
 *                 example: "Tôi thích lập trình web và muốn trở thành fullstack developer"
 *           examples:
 *             example1:
 *               summary: Đánh giá với student_id
 *               value:
 *                 student_id: "422bc9e1-cdb7-11f0-afc5-2626c197d041"
 *                 class_id: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                 career_id: "100ae3c0-c307-11f0-afc5-2626c197d041"
 *                 scores:
 *                   - criteria_id: "09352b7e-c88e-11f0-afc5-2626c197d041"
 *                     score: 8
 *                   - criteria_id: "136a34be-c88e-11f0-afc5-2626c197d041"
 *                     score: 7
 *                   - criteria_id: "1eb661d4-c88e-11f0-afc5-2626c197d041"
 *                     score: 9
 *                 notes: "Tôi rất đam mê công nghệ"
 *             example2:
 *               summary: Không truyền student_id (lấy từ user đăng nhập)
 *               value:
 *                 class_id: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *                 career_id: "100ae3c0-c307-11f0-afc5-2626c197d041"
 *                 scores:
 *                   - criteria_id: "09352b7e-c88e-11f0-afc5-2626c197d041"
 *                     score: 7.5
 *                   - criteria_id: "136a34be-c88e-11f0-afc5-2626c197d041"
 *                     score: 8.5
 *                   - criteria_id: "1eb661d4-c88e-11f0-afc5-2626c197d041"
 *                     score: 6
 *     responses:
 *       201:
 *         description: Nộp bài đánh giá thành công
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
 *                     weighted_score:
 *                       type: number
 *                     max_score:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     evaluation_result:
 *                       type: string
 *                       enum: [VERY_SUITABLE, SUITABLE, NOT_SUITABLE]
 *                     breakdown:
 *                       type: object
 *       400:
 *         description: Thiếu dữ liệu hoặc dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/submit", checkAuth, careerEvaluationsController.submitCareerEvaluation);

/**
 * @swagger
 * /api/v2/students/career-evaluations/results:
 *   get:
 *     summary: Xem kết quả đánh giá nghề nghiệp của học sinh
 *     description: |
 *       Lấy danh sách tất cả kết quả đánh giá nghề nghiệp của học sinh.
 *       
 *       **Response bao gồm:**
 *       - Thông tin tổng quan: điểm, %, kết luận (Rất phù hợp/Phù hợp/Không phù hợp)
 *       - Chi tiết từng tiêu chí:
 *         + Điểm thô (raw_score)
 *         + Trọng số (weight)
 *         + Điểm trọng số (weighted_score)
 *       
 *       **Filter options:**
 *       - Không filter → Lấy tất cả kết quả đánh giá của học sinh
 *       - Filter career_id → Chỉ lấy kết quả nghề nghiệp cụ thể
 *       - Filter class_id → Chỉ lấy kết quả trong lớp này
 *       - Filter cả 2 → Kết quả của 1 nghề trong 1 lớp
 *       
 *       **Use case:**
 *       - Học sinh xem lại các nghề đã đánh giá
 *       - So sánh mức độ phù hợp giữa các nghề
 *       - Xem chi tiết điểm breakdown từng tiêu chí
 *       - Tìm nghề phù hợp nhất (percentage cao nhất)
 *       
 *       **Ví dụ response:**
 *       ```json
 *       {
 *         "success": true,
 *         "data": [
 *           {
 *             "career_name": "Software Engineer",
 *             "weighted_score": 7.65,
 *             "max_score": 10,
 *             "percentage": 76.5,
 *             "evaluation_result": "SUITABLE",
 *             "detailed_scores": [
 *               { "criteria_name": "Tư duy logic", "raw_score": 8, "weight": 30, "weighted_score": "2.40" },
 *               { "criteria_name": "Lập trình", "raw_score": 7, "weight": 30, "weighted_score": "2.10" }
 *             ]
 *           }
 *         ]
 *       }
 *       ```
 *     tags: [V2 - Students - Career Evaluations]
 *     parameters:
 *       - in: query
 *         name: career_id
 *         schema:
 *           type: string
 *         description: Lọc theo nghề nghiệp (optional)
 *         example: "career-123-abc"
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *         description: Lọc theo lớp học (optional)
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *     responses:
 *       200:
 *         description: Danh sách kết quả đánh giá
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       student_id:
 *                         type: string
 *                       class_id:
 *                         type: string
 *                       career_id:
 *                         type: string
 *                       weighted_score:
 *                         type: number
 *                       max_score:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       evaluation_result:
 *                         type: string
 *                       evaluated_at:
 *                         type: string
 *                         format: date-time
 *                       detailed_scores:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             criteria_id:
 *                               type: string
 *                             raw_score:
 *                               type: number
 *                             weight:
 *                               type: number
 *                             weighted_score:
 *                               type: string
 *       500:
 *         description: Lỗi server
 */
router.get("/results", checkAuth, careerEvaluationsController.getMyEvaluationResults);

module.exports = router;
