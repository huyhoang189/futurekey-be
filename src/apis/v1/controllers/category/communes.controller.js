const { StatusCodes } = require("http-status-codes");
const communesService = require("../../services/category/communes.service");

/**
 * Lấy danh sách communes
 * GET /api/v1/system-admin/communes?page=1&limit=10
 */
const getAllCommunes = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, name, province_id } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [{ name: { contains: search } }];
    }

    if (name) {
      filters.name = { contains: name };
    }

    if (province_id) {
      filters.province_id = { equals: province_id };
    }

    const result = await communesService.getAllCommunes({
      filters,
      paging: { skip, limit },
      orderBy: { name: "asc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all communes successfully",
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
 * Lấy thông tin commune theo ID
 * GET /api/v1/system-admin/communes/:id
 */
const getCommuneById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Commune ID is required",
      });
    }

    const commune = await communesService.getCommuneById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get commune successfully",
      data: commune,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thêm mới commune
 * POST /api/v1/system-admin/communes
 */
const createCommune = async (req, res) => {
  try {
    const { name, province_id } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Commune name is required",
      });
    }

    const commune = await communesService.createCommune({
      name,
      province_id,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create commune successfully",
      data: commune,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật commune
 * PUT /api/v1/system-admin/communes/:id
 */
const updateCommune = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, province_id } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Commune ID is required",
      });
    }

    const commune = await communesService.updateCommune(id, {
      name,
      province_id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update commune successfully",
      data: commune,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xóa vĩnh viễn commune
 * DELETE /api/v1/system-admin/communes/:id
 */
const deleteCommune = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Commune ID is required",
      });
    }

    const result = await communesService.deleteCommune(id);

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
  getAllCommunes,
  getCommuneById,
  createCommune,
  updateCommune,
  deleteCommune,
};
