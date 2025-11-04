const { StatusCodes } = require("http-status-codes");
const groupsService = require("../../services/system-admin/groups.service");

/**
 * Lấy danh sách groups
 * GET /api/v1/system-admin/groups?page=1&limit=10
 */
const getAllGroups = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, type } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (type) {
      filters.type = type;
    }

    const result = await groupsService.getAllGroups({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all groups successfully",
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
 * Lấy thông tin group theo ID
 * GET /api/v1/system-admin/groups/:id
 */
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const group = await groupsService.getGroupById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get group successfully",
      data: group,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thêm mới group
 * POST /api/v1/system-admin/groups
 */
const createGroup = async (req, res) => {
  try {
    const { name, description, type } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Group name is required",
      });
    }

    const group = await groupsService.createGroup({
      name,
      description,
      type,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create group successfully",
      data: group,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật group
 * PUT /api/v1/system-admin/groups/:id
 */
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const group = await groupsService.updateGroup(id, {
      name,
      description,
      type,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update group successfully",
      data: group,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xóa vĩnh viễn group
 * DELETE /api/v1/system-admin/groups/:id
 */
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const result = await groupsService.deleteGroup(id);

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
 * Lấy danh sách roles của group
 * GET /api/v1/system-admin/groups/:id/roles
 */
const getGroupRoles = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const roles = await groupsService.getGroupRoles(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get group roles successfully",
      data: roles,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lấy danh sách users trong group
 * GET /api/v1/system-admin/groups/:id/users
 */
const getGroupUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = req.pagination;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Group ID is required",
      });
    }

    const result = await groupsService.getGroupUsers(id, { skip, limit });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get group users successfully",
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
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupRoles,
  getGroupUsers,
};
