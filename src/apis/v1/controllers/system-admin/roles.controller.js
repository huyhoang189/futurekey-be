const { StatusCodes } = require("http-status-codes");
const rolesService = require("../../services/system-admin/roles.service");

/**
 * Lấy danh sách roles
 * GET /api/v1/system-admin/roles?page=1&limit=10
 */
const getAllRoles = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, group_id } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (group_id) {
      filters.group_id = group_id;
    }

    const result = await rolesService.getAllRoles({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all roles successfully",
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
 * Lấy thông tin role theo ID
 * GET /api/v1/system-admin/roles/:id
 */
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Role ID is required",
      });
    }

    const role = await rolesService.getRoleById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get role successfully",
      data: role,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thêm mới role
 * POST /api/v1/system-admin/roles
 */
const createRole = async (req, res) => {
  try {
    const { group_id, name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Role name is required",
      });
    }

    if (!group_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const role = await rolesService.createRole({
      group_id,
      name,
      description,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create role successfully",
      data: role,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật role
 * PUT /api/v1/system-admin/roles/:id
 */
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { group_id, name, description } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Role ID is required",
      });
    }

    const role = await rolesService.updateRole(id, {
      group_id,
      name,
      description,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update role successfully",
      data: role,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xóa vĩnh viễn role
 * DELETE /api/v1/system-admin/roles/:id
 */
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Role ID is required",
      });
    }

    const result = await rolesService.deleteRole(id);

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
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
