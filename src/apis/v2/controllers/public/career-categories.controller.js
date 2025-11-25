const { StatusCodes } = require("http-status-codes");
const careerCategoriesService = require("../../services/public/career-categories.service");

/**
 * Lấy tất cả danh sách nhóm nghề (public API)
 * GET /api/v2/public/career-categories
 */
const getAllCareerCategories = async (req, res) => {
  try {
    const categories =
      await careerCategoriesService.getAllCareerCategoriesPublic();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all career categories successfully",
      data: categories,
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
};
