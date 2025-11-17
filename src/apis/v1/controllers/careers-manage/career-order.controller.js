const { StatusCodes } = require("http-status-codes");
const careerOrderService = require("../../services/careers-manage/career-order.service");
const userService = require("../../services/system-admin/users.service");

/**
 * Lấy danh sách đơn hàng nghề nghiệp
 * GET /api/v1/careers-manage/career-orders?page=1&limit=10
 */
const getAllCareerOrders = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { status } = req.query;

    // Build filters
    const filters = {};

    if (status) {
      filters.status = { equals: status };
    }

    const result = await careerOrderService.getAllCareerOrders({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all career orders successfully",
      data: result.data,
      meta: {
        ...result.meta,
        page,
      },
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lấy đơn hàng theo ID
 * GET /api/v1/careers-manage/career-orders/:id
 */
const getCareerOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career order ID is required",
      });
    }

    const order = await careerOrderService.getCareerOrderById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career order successfully",
      data: order,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
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
 * Tạo mới đơn hàng nghề nghiệp
 * POST /api/v1/careers-manage/career-orders
 */
const createCareerOrder = async (req, res) => {
  try {
    const { school_id, note, career_ids } = req.body;

    // Lấy thông tin user từ session
    const { userSession } = req;
    const holderUser = await userService.getUserByUsername(
      userSession?.user_name
    );

    if (!holderUser) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate
    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "school_id is required",
      });
    }

    if (!career_ids || !Array.isArray(career_ids) || career_ids.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "career_ids is required and must be a non-empty array",
      });
    }

    const order = await careerOrderService.createCareerOrder({
      school_id,
      create_by: holderUser.id,
      note,
      career_ids,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create career order successfully",
      data: order,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message.includes("Duplicate") ||
      error.message.includes("already exists")
    ) {
      return res.status(StatusCodes.CONFLICT).json({
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
 * Duyệt hoặc từ chối đơn hàng
 * PUT /api/v1/careers-manage/career-orders/:id/review
 */
const reviewCareerOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    // Lấy thông tin user từ session
    const { userSession } = req;
    const holderUser = await userService.getUserByUsername(
      userSession?.user_name
    );

    if (!holderUser) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career order ID is required",
      });
    }

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "status must be APPROVED or REJECTED",
      });
    }

    const order = await careerOrderService.reviewCareerOrder(id, {
      status,
      reviewed_by: holderUser.id,
      note,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Career order ${status.toLowerCase()} successfully`,
      data: order,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("Cannot review")) {
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
 * Xóa đơn hàng
 * DELETE /api/v1/careers-manage/career-orders/:id
 */
const deleteCareerOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career order ID is required",
      });
    }

    const result = await careerOrderService.deleteCareerOrder(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
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
  getAllCareerOrders,
  getCareerOrderById,
  createCareerOrder,
  reviewCareerOrder,
  deleteCareerOrder,
};
