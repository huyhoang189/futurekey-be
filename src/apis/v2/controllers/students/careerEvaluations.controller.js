const { StatusCodes } = require("http-status-codes");
const careerEvaluationsService = require("../../services/schools/careerEvaluations.service");

/**
 * Học sinh nộp bài đánh giá nghề nghiệp
 */
const submitCareerEvaluation = async (req, res) => {
  try {
    const { student_id, class_id, career_id, scores } = req.body;
    const userId = req.userSession?.sub; // user_id từ JWT

    if (!class_id || !career_id || !scores || !Array.isArray(scores)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id, career_id, and scores are required",
      });
    }

    const result = await careerEvaluationsService.submitCareerEvaluation(
      class_id,
      career_id,
      scores,
      student_id,
      userId
    );

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Career evaluation submitted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xem kết quả đánh giá của học sinh
 */
const getMyEvaluationResults = async (req, res) => {
  try {
    const userId = req.userSession?.sub;
    const { career_id, class_id, student_id } = req.query;

    const result = await careerEvaluationsService.getMyEvaluationResults({
      career_id,
      class_id,
      student_id,
      userId,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get evaluation results successfully",
      data: result,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  submitCareerEvaluation,
  getMyEvaluationResults,
};
