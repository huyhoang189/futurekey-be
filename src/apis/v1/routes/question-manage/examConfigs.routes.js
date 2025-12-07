const express = require("express");
const router = express.Router();
const examConfigsController = require("../../controllers/question-manage/examConfigs.controller");
const checkAuth = require("../../../../middlewares/authentication/checkAuth");

/**
 * @swagger
 * tags:
 *   name: V1 - Exam Configs
 *   description: API quản lý cấu hình đề thi (không còn bảng exams)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ExamConfigDistribution:
 *       type: object
 *       properties:
 *         category_id:
 *           type: string
 *           example: 66b575e0-c29a-11f0-afc5-2626c197d041
 *         quantity:
 *           type: integer
 *           example: 10
 *         easy_count:
 *           type: integer
 *           example: 5
 *         medium_count:
 *           type: integer
 *           example: 3
 *         hard_count:
 *           type: integer
 *           example: 2
 *     ExamConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: config-123-abc
 *         config_name:
 *           type: string
 *           example: Bài kiểm tra tổng hợp - Khám phá bản thân
 *         description:
 *           type: string
 *           example: Đề thi đánh giá tổng hợp năng lực và sở thích nghề nghiệp
 *         exam_type_scope:
 *           type: string
 *           enum: [COMPREHENSIVE, CRITERIA_SPECIFIC]
 *           example: COMPREHENSIVE
 *           description: COMPREHENSIVE (chỉ 1 bản ghi) hoặc CRITERIA_SPECIFIC
 *         career_criteria_id:
 *           type: string
 *           example: null
 *           description: Null nếu COMPREHENSIVE, bắt buộc nếu CRITERIA_SPECIFIC
 *         time_limit_minutes:
 *           type: integer
 *           example: 45
 *         total_points:
 *           type: number
 *           example: 10
 *         pass_score:
 *           type: number
 *           example: 5
 *         created_by:
 *           type: string
 *           example: user-123-abc
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         distributions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ExamConfigDistribution'
 */

/**
 * @swagger
 * /api/v1/question-manage/exam-configs:
 *   get:
 *     summary: Lấy danh sách cấu hình đề thi
 *     description: |
 *       Lấy tất cả exam configs với pagination và filters.
 *       
 *       **Mô hình mới:**
 *       - KHÔNG còn bảng `exams`, `exam_questions`
 *       - Chỉ lưu cấu hình (exam_configs + exam_config_distributions)
 *       - Khi học sinh start exam → random câu hỏi từ ngân hàng theo distributions
 *       
 *       **2 loại exam:**
 *       - `COMPREHENSIVE`: Bài thi tổng hợp (CHỈ 1 BẢN GHI), career_criteria_id = null
 *       - `CRITERIA_SPECIFIC`: Bài thi theo tiêu chí (nhiều bản ghi, mỗi bản ghi có career_criteria_id riêng)
 *       
 *       **Quy trình gen đề:**
 *       1. Học sinh startExam với exam_type + career_criteria_id (nếu CRITERIA_SPECIFIC)
 *       2. Hệ thống tự tìm exam_config phù hợp
 *       3. Lấy distributions từ exam_config_distributions
 *       4. Random câu hỏi theo từng category với số lượng + độ khó
 *       5. Lưu snapshot vào student_exam_attempts
 *     tags: [V1 - Exam Configs]
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
 *         description: Tìm kiếm theo tên config
 *       - in: query
 *         name: exam_type_scope
 *         schema:
 *           type: string
 *           enum: [COMPREHENSIVE, CRITERIA_SPECIFIC]
 *         description: Lọc theo loại bài thi
 *       - in: query
 *         name: career_criteria_id
 *         schema:
 *           type: string
 *         description: Lọc theo tiêu chí nghề nghiệp
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
 *                     $ref: '#/components/schemas/ExamConfig'
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
router.get("/", checkAuth, examConfigsController.getAllExamConfigs);

/**
 * @swagger
 * /api/v1/question-manage/exam-configs/{id}:
 *   get:
 *     summary: Lấy chi tiết exam config theo ID
 *     tags: [V1 - Exam Configs]
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
 *                   $ref: '#/components/schemas/ExamConfig'
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", checkAuth, examConfigsController.getExamConfigById);

/**
 * @swagger
 * /api/v1/question-manage/exam-configs:
 *   post:
 *     summary: Tạo cấu hình đề thi mới
 *     description: |
 *       Tạo exam_config với distributions theo question_categories.
 *       
 *       **Quy trình:**
 *       1. Tạo exam_config (tên, type, thời gian, điểm số)
 *       2. Tạo distributions (phân bổ câu hỏi theo category và độ khó)
 *       3. Khi học sinh startExam → random câu hỏi theo distributions
 *       4. Lưu snapshot_data vào student_exam_attempts
 *       
 *       **Validation quan trọng:**
 *       - COMPREHENSIVE: CHỈ được có 1 bản ghi duy nhất, career_criteria_id PHẢI null
 *       - CRITERIA_SPECIFIC: career_criteria_id BẮT BUỘC, có thể nhiều bản ghi
 *       - Mỗi distribution: quantity = easy_count + medium_count + hard_count
 *       
 *       **Ví dụ:**
 *       - COMPREHENSIVE: 30 câu từ 3 categories (Tư duy logic 10, Tính cách 15, Sở thích 5)
 *       - CRITERIA_SPECIFIC: 20 câu cho Criteria "Phát triển cá nhân"
 *     tags: [V1 - Exam Configs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config_name
 *               - distributions
 *             properties:
 *               config_name:
 *                 type: string
 *                 example: Bài kiểm tra tổng hợp - Khám phá bản thân
 *               description:
 *                 type: string
 *                 example: Đề thi đánh giá tổng hợp năng lực và sở thích nghề nghiệp
 *               exam_type_scope:
 *                 type: string
 *                 enum: [COMPREHENSIVE, CRITERIA_SPECIFIC]
 *                 default: COMPREHENSIVE
 *                 example: COMPREHENSIVE
 *               career_criteria_id:
 *                 type: string
 *                 example: null
 *                 description: Null cho COMPREHENSIVE, bắt buộc cho CRITERIA_SPECIFIC
 *               time_limit_minutes:
 *                 type: integer
 *                 example: 45
 *               total_points:
 *                 type: number
 *                 example: 10
 *               pass_score:
 *                 type: number
 *                 example: 5
 *               distributions:
 *                 type: array
 *                 description: Phân bổ câu hỏi theo từng category
 *                 items:
 *                   type: object
 *                   required:
 *                     - category_id
 *                     - quantity
 *                   properties:
 *                     category_id:
 *                       type: string
 *                       example: 66b575e0-c29a-11f0-afc5-2626c197d041
 *                     quantity:
 *                       type: integer
 *                       example: 10
 *                     easy_count:
 *                       type: integer
 *                       example: 5
 *                       default: 0
 *                     medium_count:
 *                       type: integer
 *                       example: 3
 *                       default: 0
 *                     hard_count:
 *                       type: integer
 *                       example: 2
 *                       default: 0
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
 *                   $ref: '#/components/schemas/ExamConfig'
 *       400:
 *         description: Validation error (duplicate COMPREHENSIVE, missing career_criteria_id, etc.)
 */
router.post("/", checkAuth, examConfigsController.createExamConfig);

/**
 * @swagger
 * /api/v1/question-manage/exam-configs/{id}:
 *   put:
 *     summary: Cập nhật cấu hình đề thi
 *     description: |
 *       Sửa exam config và distributions (tất cả fields optional).
 *       
 *       **Validation quan trọng:**
 *       - KHÔNG thể update thành COMPREHENSIVE nếu đã có bản ghi COMPREHENSIVE khác
 *       - COMPREHENSIVE KHÔNG được có career_criteria_id
 *       - CRITERIA_SPECIFIC BẮT BUỘC có career_criteria_id
 *       - Nếu update distributions: quantity = easy_count + medium_count + hard_count
 *       
 *       **Lưu ý:**
 *       - Chỉ update config, KHÔNG ảnh hưởng bài thi đã làm (đã lưu snapshot)
 *       - Update distributions sẽ XÓA hết distributions cũ và tạo mới
 *     tags: [V1 - Exam Configs]
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
 *               config_name:
 *                 type: string
 *                 example: Bài kiểm tra tổng hợp - Cập nhật
 *               description:
 *                 type: string
 *                 example: Mô tả mới cho đề thi
 *               exam_type_scope:
 *                 type: string
 *                 enum: [COMPREHENSIVE, CRITERIA_SPECIFIC]
 *               career_criteria_id:
 *                 type: string
 *                 example: 4f704084-c29a-11f0-afc5-2626c197d041
 *               time_limit_minutes:
 *                 type: integer
 *                 example: 60
 *               total_points:
 *                 type: number
 *                 example: 10
 *               pass_score:
 *                 type: number
 *                 example: 6
 *               distributions:
 *                 type: array
 *                 description: Nếu truyền, sẽ XÓA hết distributions cũ và tạo mới
 *                 items:
 *                   type: object
 *                   required:
 *                     - category_id
 *                     - quantity
 *                   properties:
 *                     category_id:
 *                       type: string
 *                       example: 66b575e0-c29a-11f0-afc5-2626c197d041
 *                     quantity:
 *                       type: integer
 *                       example: 15
 *                     easy_count:
 *                       type: integer
 *                       example: 8
 *                     medium_count:
 *                       type: integer
 *                       example: 5
 *                     hard_count:
 *                       type: integer
 *                       example: 2
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
 *                   $ref: '#/components/schemas/ExamConfig'
 *       400:
 *         description: Validation error (duplicate COMPREHENSIVE, invalid career_criteria_id, etc.)
 */
router.put("/:id", checkAuth, examConfigsController.updateExamConfig);

/**
 * @swagger
 * /api/v1/question-manage/exam-configs/{id}:
 *   delete:
 *     summary: Xóa cấu hình đề thi
 *     description: |
 *       Xóa exam config (chỉ nếu chưa có học sinh làm bài).
 *       
 *       **KHÔNG xóa được nếu:**
 *       - Đã có bài thi dựa trên config này (student_exam_attempts.exam_config_id)
 *     tags: [V1 - Exam Configs]
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
 *                   example: Exam config deleted successfully
 *       400:
 *         description: Không thể xóa (đang được sử dụng)
 */
router.delete("/:id", checkAuth, examConfigsController.deleteExamConfig);

module.exports = router;
