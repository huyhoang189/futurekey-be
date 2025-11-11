const { StatusCodes } = require("http-status-codes");
const provincesService = require("../../services/system-admin/provinces.service");

/**
 * Lấy danh sách provinces
 * GET /api/v1/system-admin/provinces?page=1&limit=10
 */
const getAllProvinces = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, name } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { name: { contains: search } },
      ];
    }

    if (name) {
      filters.name = { contains: name };
    }

    const result = await provincesService.getAllProvinces({
      filters,
      paging: { skip, limit },
      orderBy: { name: "asc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all provinces successfully",
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
 * Lấy thông tin province theo ID
 * GET /api/v1/system-admin/provinces/:id
 */
const getProvinceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Province ID is required",
      });
    }

    const province = await provincesService.getProvinceById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get province successfully",
      data: province,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thêm mới province
 * POST /api/v1/system-admin/provinces
 */
const createProvince = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Province name is required",
      });
    }

    const province = await provincesService.createProvince({
      name,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create province successfully",
      data: province,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật province
 * PUT /api/v1/system-admin/provinces/:id
 */
const updateProvince = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Province ID is required",
      });
    }

    const province = await provincesService.updateProvince(id, {
      name,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update province successfully",
      data: province,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xóa vĩnh viễn province
 * DELETE /api/v1/system-admin/provinces/:id
 */
const deleteProvince = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Province ID is required",
      });
    }

    const result = await provincesService.deleteProvince(id);

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

/**
 * Lấy danh sách communes trong province
 * GET /api/v1/system-admin/provinces/:id/communes
 */
const getProvinceCommunes = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = req.pagination;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Province ID is required",
      });
    }

    const result = await provincesService.getProvinceCommunes(id, { skip, limit });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get province communes successfully",
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
  getAllProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
  getProvinceCommunes,
};