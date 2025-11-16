const { StatusCodes } = require("http-status-codes");
const careerOrderItemService = require("../../services/careers-manage/career-order-item.service");

/**
 * Lấy danh sách items của đơn hàng
 * GET /api/v1/careers-manage/career-order-items?order_id=xxx&page=1&limit=10
 */
const getAllCareerOrderItems = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { order_id, career_id } = req.query;

    // Validate order_id bắt buộc
    if (!order_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "order_id is required",
      });
    }

    // Build filters
    const filters = {};
    if (career_id) {
      filters.career_id = career_id;
    }

    const result = await careerOrderItemService.getAllCareerOrderItems({
      order_id,
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all career order items successfully",
      data: result.data,
      meta: {
        ...result.meta,
        page,
      },
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
 * Lấy item theo ID
 * GET /api/v1/careers-manage/career-order-items/:id
 */
const getCareerOrderItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career order item ID is required",
      });
    }

    const item = await careerOrderItemService.getCareerOrderItemById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career order item successfully",
      data: item,
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
 * Tạo mới item cho đơn hàng
 * POST /api/v1/careers-manage/career-order-items
 */
const createCareerOrderItem = async (req, res) => {
  try {
    const { order_id, career_id, price } = req.body;

    // Validate
    if (!order_id || !career_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "order_id and career_id are required",
      });
    }

    const item = await careerOrderItemService.createCareerOrderItem({
      order_id,
      career_id,
      price,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create career order item successfully",
      data: item,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("already exists")) {
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
 * Cập nhật item
 * PUT /api/v1/careers-manage/career-order-items/:id
 */
const updateCareerOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { career_id, price } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career order item ID is required",
      });
    }

    const item = await careerOrderItemService.updateCareerOrderItem(id, {
      career_id,
      price,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update career order item successfully",
      data: item,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("already exists")) {
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
 * Xóa item
 * DELETE /api/v1/careers-manage/career-order-items/:id
 */
const deleteCareerOrderItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career order item ID is required",
      });
    }

    const result = await careerOrderItemService.deleteCareerOrderItem(id);

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

/**
 * Xóa tất cả items của một đơn hàng
 * DELETE /api/v1/careers-manage/career-order-items/order/:order_id
 */
const deleteAllItemsByOrderId = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "order_id is required",
      });
    }

    const result = await careerOrderItemService.deleteAllItemsByOrderId(
      order_id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      deletedCount: result.deletedCount,
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
  getAllCareerOrderItems,
  getCareerOrderItemById,
  createCareerOrderItem,
  updateCareerOrderItem,
  deleteCareerOrderItem,
  deleteAllItemsByOrderId,
};
