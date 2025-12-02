const { StatusCodes } = require("http-status-codes");
const careerEvaluationsService = require("../../services/schools/careerEvaluations.service");

/**
 * Cấu hình trọng số tiêu chí cho lớp học và nghề nghiệp
 */
const configureCriteriaWeights = async (req, res) => {
  try {
    const { class_id, career_id, weights } = req.body;
    const createdBy = req.user?.id || req.schoolUser?.id;

    if (!class_id || !career_id || !weights || !Array.isArray(weights)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id, career_id, and weights are required",
      });
    }

    const result = await careerEvaluationsService.configureCriteriaWeights(
      class_id,
      career_id,
      weights,
      createdBy
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Criteria weights configured successfully",
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
 * Lấy cấu hình trọng số tiêu chí
 */
const getCriteriaWeights = async (req, res) => {
  try {
    const { class_id, career_id } = req.query;

    if (!class_id || !career_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id and career_id are required",
      });
    }

    const result = await careerEvaluationsService.getCriteriaWeights(
      class_id,
      career_id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get criteria weights successfully",
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
 * Cấu hình ngưỡng đánh giá
 */
const configureEvaluationThresholds = async (req, res) => {
  try {
    const { class_id, career_id, very_suitable_min, suitable_min } = req.body;
    const createdBy = req.user?.id || req.schoolUser?.id;

    if (
      !class_id ||
      !career_id ||
      very_suitable_min === undefined ||
      suitable_min === undefined
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id, career_id, very_suitable_min, and suitable_min are required",
      });
    }

    const result = await careerEvaluationsService.configureEvaluationThresholds(
      class_id,
      career_id,
      { very_suitable_min, suitable_min },
      createdBy
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Evaluation thresholds configured successfully",
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
 * Lấy cấu hình ngưỡng đánh giá
 */
const getEvaluationThresholds = async (req, res) => {
  try {
    const { class_id, career_id } = req.query;

    if (!class_id || !career_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id and career_id are required",
      });
    }

    const result = await careerEvaluationsService.getEvaluationThresholds(
      class_id,
      career_id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get evaluation thresholds successfully",
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
 * Thống kê kết quả đánh giá của lớp
 */
const getEvaluationStatistics = async (req, res) => {
  try {
    const { class_id, career_id } = req.query;

    if (!class_id || !career_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id and career_id are required",
      });
    }

    const result = await careerEvaluationsService.getEvaluationStatistics(
      class_id,
      career_id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get evaluation statistics successfully",
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
  configureCriteriaWeights,
  getCriteriaWeights,
  configureEvaluationThresholds,
  getEvaluationThresholds,
  getEvaluationStatistics,
};
