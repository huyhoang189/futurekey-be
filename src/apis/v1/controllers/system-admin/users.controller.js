const { StatusCodes } = require("http-status-codes");
const usersService = require("../../services/system-admin/users.service");

/**
 * Lấy danh sách users
 * GET /api/v1/system-admin/users?page=1&limit=10
 */
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, status, group_id } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { user_name: { contains: search } },
        { full_name: { contains: search } },
        { email: { contains: search } },
        { phone_number: { contains: search } },
      ];
    }

    if (status) {
      filters.status = status;
    }

    if (group_id) {
      filters.group_id = group_id;
    }

    const result = await usersService.getAllUsers({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all users successfully",
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
 * Thêm mới user
 * POST /api/v1/system-admin/users
 */
const createUser = async (req, res) => {
  try {
    const {
      user_name,
      full_name,
      email,
      phone_number,
      address,
      description,
      group_id,
      password,
    } = req.body;

    // Validate required fields
    if (!user_name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Username is required",
      });
    }

    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await usersService.createUser({
      user_name,
      full_name,
      email,
      phone_number,
      address,
      description,
      group_id,
      password,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create user successfully",
      data: user,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật profile user
 * PUT /api/v1/system-admin/users/:id
 */
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_name,
      full_name,
      email,
      phone_number,
      address,
      description,
      group_id,
    } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await usersService.updateProfile(id, {
      user_name,
      full_name,
      email,
      phone_number,
      address,
      description,
      group_id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update user successfully",
      data: user,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xóa vĩnh viễn user
 * DELETE /api/v1/system-admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await usersService.deleteUser(id);

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
 * Ban user (chặn người dùng)
 * PUT /api/v1/system-admin/users/:id/ban
 */
const banUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await usersService.updateStatus(id, "BANNER");

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User banned successfully",
      data: user,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Active user (kích hoạt người dùng)
 * PUT /api/v1/system-admin/users/:id/active
 */
const activeUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await usersService.updateStatus(id, "ACTIVE");

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User activated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Inactive user (vô hiệu hóa người dùng)
 * PUT /api/v1/system-admin/users/:id/inactive
 */
const inactiveUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await usersService.updateStatus(id, "INACTIVE");

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User inactivated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateProfile,
  deleteUser,
  banUser,
  activeUser,
  inactiveUser,
};
