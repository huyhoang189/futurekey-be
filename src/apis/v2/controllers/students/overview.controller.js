const { StatusCodes } = require("http-status-codes");
const overviewService = require("../../services/students/overview.service");

/**
 * Get careers overview statistics for authenticated student
 */
const getCareersOverview = async (req, res) => {
  try {
    const student = req.student;

    if (!student?.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required: student not found",
      });
    }

    if (!student?.class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    const stats = await overviewService.getCareerOverviewStats({
      student_id: student.id,
      class_id: student.class_id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career overview statistics successfully",
      data: stats,
    });
  } catch (error) {
    if (error.message.includes("required")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get overview: ${error.message}`,
    });
  }
};

/**
 * Get list of careers student is learning with progress
 */
const getCareersInProgress = async (req, res) => {
  try {
    const student = req.student;

    if (!student?.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required: student not found",
      });
    }

    if (!student?.class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    const careers = await overviewService.getCareersInProgress({
      student_id: student.id,
      class_id: student.class_id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get careers in progress successfully",
      data: careers,
    });
  } catch (error) {
    if (error.message.includes("required")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get careers: ${error.message}`,
    });
  }
};

/**
 * Get weekly learning statistics
 */
const getWeeklyLearningStats = async (req, res) => {
  try {
    const student = req.student;
    const { time_range } = req.query;

    if (!student?.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required: student not found",
      });
    }

    if (!student?.class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    // Validate time_range parameter
    const validTimeRanges = ["1month", "3months", "6months"];
    const selectedTimeRange =
      time_range && validTimeRanges.includes(time_range)
        ? time_range
        : "1month";

    const stats = await overviewService.getWeeklyLearningStats({
      student_id: student.id,
      class_id: student.class_id,
      time_range: selectedTimeRange,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get weekly learning statistics successfully",
      data: stats,
    });
  } catch (error) {
    if (error.message.includes("required")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get weekly stats: ${error.message}`,
    });
  }
};

module.exports = {
  getCareersOverview,
  getCareersInProgress,
  getWeeklyLearningStats,
};
