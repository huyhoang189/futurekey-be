const studentExamsService = require("../../services/students/studentExams.service");

/**
 * @swagger
 * /api/v1/student/exams/{examId}/start:
 *   post:
 *     tags: [Student Exams]
 *     summary: Bắt đầu làm bài thi
 */
const startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.userSession.sub; // JWT payload sử dụng 'sub' field

    const result = await studentExamsService.generateExamForStudent(examId, studentId);

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
 * /api/v1/student/exams/attempts/{attemptId}/answers:
 *   post:
 *     tags: [Student Exams]
 *     summary: Lưu câu trả lời (auto-save)
 */
const saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { question_id, answer_data } = req.body;

    const answer = await studentExamsService.saveStudentAnswer(attemptId, question_id, answer_data);

    return res.status(200).json({
      success: true,
      data: answer,
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
 * /api/v1/student/exams/attempts/{attemptId}/submit:
 *   post:
 *     tags: [Student Exams]
 *     summary: Nộp bài thi
 */
const submitExam = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const result = await studentExamsService.submitExam(attemptId);

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
 * /api/v1/student/exams/attempts/{attemptId}/results:
 *   get:
 *     tags: [Student Exams]
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
 * /api/v1/system-admin/exams/need-grading:
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
 * /api/v1/system-admin/exams/answers/{answerId}/grade:
 *   post:
 *     tags: [Teacher Grading]
 *     summary: Chấm câu hỏi tự luận
 */
const gradeEssayQuestion = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { score, feedback } = req.body;
    const gradedBy = req.userSession.sub; // JWT payload sử dụng 'sub' field

    const result = await studentExamsService.gradeEssayQuestion(answerId, score, feedback, gradedBy);

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
  saveAnswer,
  submitExam,
  getExamResults,
  getExamsNeedGrading,
  gradeEssayQuestion,
};
