const { StatusCodes } = require("http-status-codes");
const statisticsService = require("../../services/system-admin/statistics.service");

/**
 * Lấy thống kê tổng quan cho trường
 * GET /api/v1/system-admin/statistics/school-overview
 */
const getSchoolOverview = async (req, res) => {
  try {
    const { school_id } = req.query;

    const overview = await statisticsService.getSchoolOverview(school_id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get school overview successfully",
      data: overview,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thống kê học sinh theo khối
 * GET /api/v1/system-admin/statistics/students-by-level
 */
const getStudentsByLevel = async (req, res) => {
  try {
    const { school_id } = req.query;

    const statistics = await statisticsService.getStudentsByLevel(school_id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get students by level successfully",
      data: statistics,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSchoolOverview,
  getStudentsByLevel,
};
