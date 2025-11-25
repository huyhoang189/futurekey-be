const { StatusCodes } = require("http-status-codes");
const careerCategoriesService = require("../../services/category/career-categories.service");

/**
 * Lấy danh sách career categories
 * GET /api/v1/category/career-categories?page=1&limit=10
 */
const getAllCareerCategories = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [{ name: { contains: search } }];
    }

    const result = await careerCategoriesService.getAllCareerCategories({
      filters,
      paging: { skip, limit },
      orderBy: { name: "asc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all career categories successfully",
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
 * Lấy thông tin career category theo ID
 * GET /api/v1/category/career-categories/:id
 */
const getCareerCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career category ID is required",
      });
    }

    const careerCategory = await careerCategoriesService.getCareerCategoryById(
      id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career category successfully",
      data: careerCategory,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thêm mới career category
 * POST /api/v1/category/career-categories
 */
const createCareerCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career category name is required",
      });
    }

    const careerCategory = await careerCategoriesService.createCareerCategory({
      name,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create career category successfully",
      data: careerCategory,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật career category
 * PUT /api/v1/category/career-categories/:id
 */
const updateCareerCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career category ID is required",
      });
    }

    const careerCategory = await careerCategoriesService.updateCareerCategory(
      id,
      {
        name,
      }
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update career category successfully",
      data: careerCategory,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xóa vĩnh viễn career category
 * DELETE /api/v1/category/career-categories/:id
 */
const deleteCareerCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career category ID is required",
      });
    }

    const result = await careerCategoriesService.deleteCareerCategory(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllCareerCategories,
  getCareerCategoryById,
  createCareerCategory,
  updateCareerCategory,
  deleteCareerCategory,
};
