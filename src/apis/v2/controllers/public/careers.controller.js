const { StatusCodes } = require("http-status-codes");
const careersService = require("../../services/public/careers.service");

/**
 * Lấy danh sách nghề (public API)
 * GET /api/v2/public/careers?page=1&limit=10&search=&category_ids=id1,id2
 */
const getAllCareers = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, category_ids } = req.query;

    // Parse category_ids from comma-separated string to array
    let categoryIdsArray = [];
    if (category_ids) {
      categoryIdsArray = category_ids
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "");
    }

    const result = await careersService.getAllCareersPublic({
      filters: {
        search,
        category_ids:
          categoryIdsArray.length > 0 ? categoryIdsArray : undefined,
      },
      paging: { skip, limit },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all careers successfully",
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

module.exports = {
  getAllCareers,
};
