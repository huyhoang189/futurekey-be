const { StatusCodes } = require("http-status-codes");
const overviewService = require("../../services/system-admin/overview.service");

/**
 * API #1: Lấy tổng quan hệ thống
 * GET /api/v1/system-admin/overview/stats
 */
const getSystemStats = async (req, res) => {
  try {
    const stats = await overviewService.getSystemStats();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get system stats successfully",
      data: stats,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * API #2: Lấy thống kê trạng thái đơn hàng
 * GET /api/v1/system-admin/overview/orders/status
 */
const getOrdersStatusStats = async (req, res) => {
  try {
    const stats = await overviewService.getOrdersStatusStats();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get orders status stats successfully",
      data: stats,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * API #3: Lấy danh sách ngành nghề được mua nhiều nhất
 * GET /api/v1/system-admin/overview/careers/top-purchased?limit=10
 */
const getTopPurchasedCareers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10);

    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid limit parameter",
      });
    }

    const careers = await overviewService.getTopPurchasedCareers(limitNum);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get top purchased careers successfully",
      data: careers,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * API #4: Lấy thống kê license theo trạng thái
 * GET /api/v1/system-admin/overview/licenses/status
 */
const getLicensesStatusStats = async (req, res) => {
  try {
    const stats = await overviewService.getLicensesStatusStats();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get licenses status stats successfully",
      data: stats,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * API #5: Lấy danh sách license sắp hết hạn
 * GET /api/v1/system-admin/overview/licenses/expiring?days=15
 */
const getExpiringLicenses = async (req, res) => {
  try {
    const { days = 15 } = req.query;
    const daysNum = parseInt(days, 10);

    if (isNaN(daysNum) || daysNum <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid days parameter",
      });
    }

    const licenses = await overviewService.getExpiringLicenses(daysNum);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get expiring licenses successfully",
      data: licenses,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSystemStats,
  getOrdersStatusStats,
  getTopPurchasedCareers,
  getLicensesStatusStats,
  getExpiringLicenses,
};
