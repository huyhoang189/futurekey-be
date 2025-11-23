const { StatusCodes } = require("http-status-codes");
const careerService = require("../../services/school-manage/career.service");

/**
 * Lấy danh sách đơn hàng đã duyệt của trường
 * GET /api/v1/school-manage/career-orders/approved?school_id=xxx&page=1&limit=10
 */
const getApprovedOrdersBySchool = async (req, res) => {
  try {
    const { school_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "school_id is required",
      });
    }

    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder || "desc";

    const result = await careerService.getApprovedOrdersBySchool({
      school_id,
      paging: { skip, limit },
      orderBy: { [sortBy]: sortOrder },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get approved orders successfully",
      data: result.data,
      meta: {
        total: result.meta.total,
        page,
        limit,
        totalPages: Math.ceil(result.meta.total / limit),
      },
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("required")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lấy danh sách nghề đã kích hoạt của trường
 * GET /api/v1/school-manage/careers/active?school_id=xxx&page=1&limit=10
 */
const getActiveCareersForSchool = async (req, res) => {
  try {
    const { school_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "school_id is required",
      });
    }

    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder || "desc";

    const result = await careerService.getActiveCareersForSchool({
      school_id,
      paging: { skip, limit },
      orderBy: { [sortBy]: sortOrder },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get active careers successfully",
      data: result.data,
      meta: {
        total: result.meta.total,
        page,
        limit,
        totalPages: Math.ceil(result.meta.total / limit),
      },
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("required")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getApprovedOrdersBySchool,
  getActiveCareersForSchool,
};
