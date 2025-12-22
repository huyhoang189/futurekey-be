const express = require("express");
const router = express.Router();
const examsController = require("../../controllers/schools/exams.controller");
const pagination = require("../../../../middlewares/validation/pagination");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Exams Management
 *   description: API quan ly bai thi cua truong hoc
 */

/**
 * @swagger
 * /api/v2/schools/exams/attempts:
 *   get:
 *     summary: Lay danh sach bai thi cua hoc sinh theo lop
 *     description: |
 *       API danh cho giao vien/truong hoc de quan ly va xem danh sach bai thi cua hoc sinh trong lop.
 *
 *       **Chuc nang:**
 *       - Loc theo lop (bat buoc)
 *       - Tim kiem theo ten hoac ma hoc sinh
 *       - Loc theo nghe nghiep
 *       - Loc theo tieu chi cu the
 *       - Loc theo trang thai (IN_PROGRESS, SUBMITTED, GRADED)
 *       - Phan trang va sap xep
 *
 *       **Du lieu tra ve:**
 *       - Ma hoc sinh, ten hoc sinh
 *       - Ten bai thi (tu tieu chi hoac ten config)
 *       - Ten nghe nghiep
 *       - Thoi gian bat dau va nop bai
 *       - Diem so, diem toi da va phan tram
 *       - Trang thai
 *     tags: [V2 - Schools - Exams Management]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cua lop hoc (bat buoc)
 *         example: "2f238ea5-cd51-11f0-afc5-2626c197d041"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tim kiem theo ten hoac ma hoc sinh
 *         example: "Nguyễn Văn"
 *       - in: query
 *         name: career_id
 *         schema:
 *           type: string
 *         description: Loc theo ID nghe nghiep
 *       - in: query
 *         name: career_criteria_id
 *         schema:
 *           type: string
 *         description: Loc theo ID tieu chi nghe nghiep
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IN_PROGRESS, SUBMITTED, GRADED]
 *         description: Loc theo trang thai bai thi
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang muon lay
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: So ban ghi moi trang
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: submit_time
 *         description: Truong de sap xep (submit_time, total_score, start_time)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thu tu sap xep
 *     responses:
 *       200:
 *         description: Danh sach bai thi
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
 *                         description: ID cua attempt
 *                       student_code:
 *                         type: string
 *                         description: Ma hoc sinh
 *                         example: "HS001"
 *                       student_name:
 *                         type: string
 *                         description: Ten hoc sinh
 *                         example: "Nguyễn Văn A"
 *                       exam_name:
 *                         type: string
 *                         description: Ten bai thi (tu tieu chi hoac config)
 *                         example: "Tư duy logic"
 *                       career_name:
 *                         type: string
 *                         description: Ten nghe nghiep
 *                         example: "Lap trinh vien"
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                         description: Thoi gian bat dau
 *                       submit_time:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: Thoi gian nop bai
 *                       score:
 *                         type: number
 *                         nullable: true
 *                         description: Diem dat duoc
 *                       max_score:
 *                         type: number
 *                         description: Diem toi da
 *                       percentage:
 *                         type: string
 *                         nullable: true
 *                         description: Phần trăm điểm (%)
 *                         example: "85.50"
 *                       status:
 *                         type: string
 *                         enum: [IN_PROGRESS, SUBMITTED, GRADED]
 *                         description: Trang thai bai thi
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
 *       400:
 *         description: Thieu class_id hoac tham so khong hop le
 *       500:
 *         description: Loi server
 */
router.get("/attempts", pagination, examsController.getExamAttemptsByClass);

/**
 * @swagger
 * /api/v2/schools/exams/attempts/{attemptId}:
 *   get:
 *     summary: Lay chi tiet bai thi theo attemptId
 *     description: Tra ve attempt_info va danh sach sections (nhom theo category tu snapshot). Cau hoi duoc lay tu snapshot_data, khong truy van lai DB.
 *     tags: [V2 - Schools - Exams Management]
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiet bai thi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     attempt_info:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         status: { type: string, enum: [IN_PROGRESS, SUBMITTED, GRADED] }
 *                         total_score: { type: number, nullable: true }
 *                         max_score: { type: number, nullable: true }
 *                         duration_seconds: { type: integer, nullable: true }
 *                         submit_time: { type: string, format: date-time, nullable: true }
 *                     sections:
 *                       type: array
 *                       description: Nhom cau hoi theo category tu snapshot (thiếu category thi dat "N/A")
 *                       items:
 *                         type: object
 *                         properties:
 *                           category_name: { type: string }
 *                           questions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 question_id: { type: string }
 *                                 type: { type: string, enum: [MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY] }
 *                                 content: { type: string }
 *                                 points: { type: number }
 *                                 explanation: { type: string, nullable: true }
 *                                 options:
 *                                   type: array
 *                                   items: { type: object }
 *                                 correct_ids:
 *                                   type: array
 *                                   nullable: true
 *                                   items: { type: string }
 *                                 student_answer:
 *                                   type: object
 *                                   properties:
 *                                     answer_id: { type: string, nullable: true }
 *                                     content: { type: string, nullable: true }
 *                                     selected_ids:
 *                                       type: array
 *                                       nullable: true
 *                                       items: { type: string }
 *                                     is_correct: { type: boolean, nullable: true }
 *                                     score: { type: number, nullable: true }
 *                                     feedback: { type: string, nullable: true }
 *                                     is_manual_grading_required: { type: boolean }
 *       404:
 *         description: Attempt khong ton tai
 *       500:
 *         description: Loi server
 */
router.get("/attempts/:attemptId", examsController.getAttemptDetailsById);

/**
 * @swagger
 * /api/v2/schools/exams/answers/{answerId}/grade:
 *   post:
 *     summary: Cham cau hoi tu luan/short answer
 *     tags: [V2 - Schools - Exams Management]
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: string
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
 *                 description: Diem cham cho cau hoi
 *               feedback:
 *                 type: string
 *                 description: Nhan xet cho hoc sinh
 *     responses:
 *       200:
 *         description: Cham diem thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     answer_id: { type: string }
 *                     attempt_id: { type: string }
 *                     score: { type: number }
 *                     feedback: { type: string, nullable: true }
 *                     status: { type: string, enum: [IN_PROGRESS, SUBMITTED, GRADED] }
 *                     total_score: { type: number }
 *                     max_score: { type: number }
 *                     all_graded: { type: boolean, description: Tat ca cau da cham hay chua }
 *       400:
 *         description: Tham so khong hop le
 *       404:
 *         description: Answer hoac attempt khong ton tai
 */
router.post("/answers/:answerId/grade", examsController.gradeAnswer);

module.exports = router;
