const { StatusCodes } = require("http-status-codes");
const statisticsService = require("../../services/schools/statistics.service");

/**
 * Thống kê nghề nghiệp của học sinh
 * GET /api/v2/schools/statistics/students/:id/career
 */
const getStudentCareerStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const statistics = await statisticsService.getStudentCareerStatistics(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get student career statistics successfully",
      data: statistics,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thống kê đánh giá nghề nghiệp của học sinh
 * GET /api/v2/schools/statistics/students/:id/evaluations
 */
const getStudentCareerEvaluations = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const evaluations = await statisticsService.getStudentCareerEvaluations(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get student career evaluations successfully",
      data: evaluations,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thống kê tổng quan theo lớp
 * GET /api/v2/schools/statistics/classes/:id/overview
 */
const getClassOverviewStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const statistics = await statisticsService.getClassOverviewStatistics(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get class overview statistics successfully",
      data: statistics,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thống kê danh sách nghề của lớp và tiến độ trung bình
 * GET /api/v2/schools/statistics/classes/:id/career-progress
 */
const getClassCareerProgress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const progress = await statisticsService.getClassCareerProgress(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get class career progress successfully",
      data: progress,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thống kê kết quả đánh giá nghề nghiệp trung bình của lớp
 * GET /api/v2/schools/statistics/classes/:id/career-evaluations
 */
const getClassCareerEvaluations = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const evaluations = await statisticsService.getClassCareerEvaluations(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get class career evaluations successfully",
      data: evaluations,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thống kê top học sinh theo tiến độ hoàn thành
 * GET /api/v2/schools/statistics/classes/:id/top-students
 */
const getClassTopStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const limitNumber = limit ? parseInt(limit, 10) : 10;

    if (isNaN(limitNumber) || limitNumber < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Limit must be a positive number",
      });
    }

    const topStudents = await statisticsService.getClassTopStudents(id, limitNumber);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get class top students successfully",
      data: topStudents,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thống kê % trung bình hoàn thành học tập nghề của lớp
 * GET /api/v2/schools/statistics/classes/:id/overall-completion
 */
const getClassOverallCompletion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const completion = await statisticsService.getClassOverallCompletion(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get class overall completion successfully",
      data: completion,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getStudentCareerStatistics,
  getStudentCareerEvaluations,
  getClassOverviewStatistics,
  getClassCareerProgress,
  getClassCareerEvaluations,
  getClassTopStudents,
  getClassOverallCompletion,
};
