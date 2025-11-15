const { StatusCodes } = require("http-status-codes");
const careerCriteriaService = require("../../services/careers-manage/career-criteria.service");

/**
 * Lấy danh sách tiêu chí nghề nghiệp
 * GET /api/v1/careers-manage/career-criteria?page=1&limit=10
 */
const getAllCareerCriteria = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, is_active, career_id } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (is_active !== undefined) {
      filters.is_active = is_active === "true";
    }

    if (career_id) {
      filters.career_id = career_id;
    }

    const result = await careerCriteriaService.getAllCareerCriteria({
      filters,
      paging: { skip, limit },
      orderBy: { order_index: "asc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all career criteria successfully",
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
 * Lấy tiêu chí nghề nghiệp theo ID
 * GET /api/v1/careers-manage/career-criteria/:id
 */
const getCareerCriteriaById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career criteria ID is required",
      });
    }

    const criteria = await careerCriteriaService.getCareerCriteriaById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career criteria successfully",
      data: criteria,
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
 * Thêm mới tiêu chí nghề nghiệp
 * POST /api/v1/careers-manage/career-criteria
 */
const createCareerCriteria = async (req, res) => {
  try {
    const { name, description, order_index, is_active, career_id } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career criteria name is required",
      });
    }

    if (!career_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career ID is required",
      });
    }

    const criteria = await careerCriteriaService.createCareerCriteria({
      name,
      description,
      order_index,
      is_active,
      career_id,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create career criteria successfully",
      data: criteria,
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: error.message,
      });
    }
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
 * Cập nhật tiêu chí nghề nghiệp
 * PUT /api/v1/careers-manage/career-criteria/:id
 */
const updateCareerCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, order_index, is_active, career_id } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career criteria ID is required",
      });
    }

    const criteria = await careerCriteriaService.updateCareerCriteria(id, {
      name,
      description,
      order_index,
      is_active,
      career_id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update career criteria successfully",
      data: criteria,
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
 * Xóa vĩnh viễn tiêu chí nghề nghiệp
 * DELETE /api/v1/careers-manage/career-criteria/:id
 */
const deleteCareerCriteria = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career criteria ID is required",
      });
    }

    const result = await careerCriteriaService.deleteCareerCriteria(id);

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
 * Cập nhật trạng thái khóa tiêu chí nghề nghiệp
 * UPDATE /api/v1/careers-manage/career-criteria/:id/active
 */
const activeCareerCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career criteria ID is required",
      });
    }
    const criteria = await careerCriteriaService.getCareerCriteriaById(id);
    if (!criteria) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Career criteria not found",
      });
    }
    await careerCriteriaService.updateCareerCriteria(id, {
      criteria,
      is_active: !criteria.is_active,
    });
    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Update status to ${!criteria.is_active} successfully`,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllCareerCriteria,
  getCareerCriteriaById,
  createCareerCriteria,
  updateCareerCriteria,
  deleteCareerCriteria,
  activeCareerCriteria,
};
