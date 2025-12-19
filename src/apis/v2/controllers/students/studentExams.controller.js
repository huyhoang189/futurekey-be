const studentExamsService = require("../../services/students/studentExams.service");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Helper function để lấy student_id từ user_id
 */
const getStudentIdFromUserId = async (userId) => {
  const student = await prisma.auth_impl_user_student.findFirst({
    where: { user_id: userId },
    select: { id: true },
  });

  if (!student) {
    throw new Error("Student not found for this user");
  }

  return student.id;
};

/**
 * @swagger
 * /api/v2/students/student-exams/start:
 *   post:
 *     tags: [V2 - Students - Exams]
 *     summary: Bắt đầu làm bài thi
 *     description: |
 *       **Flow mới (không còn bảng exams):**
 *       - Học sinh chọn loại bài thi: COMPREHENSIVE (tổng hợp) hoặc CRITERIA_SPECIFIC (theo tiêu chí)
 *       - Hệ thống random câu hỏi từ ngân hàng theo exam_config
 *       - Lưu snapshot_data (câu hỏi + đáp án đúng) vào student_exam_attempts
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
 *               career_criteria_id:
 *                 type: string
 *                 example: criteria-456-def
 *                 description: Bắt buộc nếu exam_type = CRITERIA_SPECIFIC               career_id:
                 type: string
                 example: career-789-xyz
                 description: Bắt buộc nếu exam_type = COMPREHENSIVE (để lọc tiêu chí theo lớp học) */
const startExam = async (req, res) => {
  try {
    const { exam_type, career_criteria_id, career_id } = req.body;
    const userId = req.userSession.sub;
    const student_id = await getStudentIdFromUserId(userId);

    const result = await studentExamsService.startExam({
      exam_type,
      career_criteria_id,
      career_id,
      student_id,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get student's exam attempts
 */
const getMyAttempts = async (req, res) => {
  try {
    const userId = req.userSession.sub;
    const student_id = await getStudentIdFromUserId(userId);
    const { exam_type, career_criteria_id, page, limit } = req.query;

    const result = await studentExamsService.getStudentExamAttempts({
      student_id,
      exam_type,
      career_criteria_id,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get attempt details
 */
const getAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.userSession.sub;
    const student_id = await getStudentIdFromUserId(userId);

    const result = await studentExamsService.getAttemptDetails(
      attemptId,
      student_id
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @deprecated - Save answer không cần thiết với snapshot approach
 */
const saveAnswer = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "This API is deprecated. Submit all answers at once using /submit endpoint",
  });
};

/**
 * @swagger
 * /api/v2/students/student-exams/attempts/{attemptId}/submit:
 *   post:
 *     tags: [V2 - Students - Exams]
 *     summary: Nộp bài thi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: string
 *                     answer_data:
 *                       type: string
 */
const submitExam = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.userSession.sub;
    const student_id = await getStudentIdFromUserId(userId);

    const result = await studentExamsService.submitExam({
      attempt_id: attemptId,
      answers,
      student_id,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v2/students/student-exams/attempts/{attemptId}/results:
 *   get:
 *     tags: [V2 - Students - Exams]
 *     summary: Xem kết quả bài thi
 */
const getExamResults = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const results = await studentExamsService.getExamResults(attemptId);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    return res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v2/students/student-exams/need-grading:
 *   get:
 *     tags: [Teacher Grading]
 *     summary: Lấy danh sách bài thi cần chấm
 */
const getExamsNeedGrading = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const paging = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const result = await studentExamsService.getExamsNeedGrading({ paging });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v2/students/student-exams/answers/{answerId}/grade:
 *   post:
 *     tags: [Teacher Grading]
 *     summary: Chấm câu hỏi tự luận
 */
const gradeEssayQuestion = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { score, feedback } = req.body;
    const gradedBy = req.userSession.sub; // JWT payload sử dụng 'sub' field

    const result = await studentExamsService.gradeEssayQuestion(
      answerId,
      score,
      feedback,
      gradedBy
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  startExam,
  submitExam,
  getMyAttempts,
  getAttemptDetails,
  saveAnswer, // deprecated
  getExamResults, // giữ lại cho compatibility
  getExamsNeedGrading,
  gradeEssayQuestion,
};
