const { StatusCodes } = require("http-status-codes");
const schoolUsersService = require("../../services/system-admin/schoolUsers.service");

/**
 * Lấy danh sách school users
 * GET /api/v1/system-admin/school-users?page=1&limit=10
 */
const getAllSchoolUsers = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, school_id } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { description: { contains: search } },
      ];
    }

    if (school_id) {
      filters.school_id = school_id;
    }

    const result = await schoolUsersService.getAllSchoolUsers({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all school users successfully",
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
 * Lấy thông tin school user theo ID
 * GET /api/v1/system-admin/school-users/:id
 */
const getSchoolUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School user ID is required",
      });
    }

    const schoolUser = await schoolUsersService.getSchoolUserById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get school user successfully",
      data: schoolUser,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Tạo mới school user (tự động tạo user account)
 * POST /api/v1/system-admin/school-users
 */
const createSchoolUser = async (req, res) => {
  try {
    const {
      // User fields
      user_name,
      full_name,
      email,
      phone_number,
      password,
      address,
      // School user fields
      school_id,
      description,
    } = req.body;

    // Validate required fields
    if (!user_name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Username is required",
      });
    }

    if (!full_name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Full name is required",
      });
    }

    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School ID is required",
      });
    }

    const result = await schoolUsersService.createSchoolUser({
      user_name,
      full_name,
      email,
      phone_number,
      password,
      address,
      school_id,
      description,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create school user successfully",
      data: result.schoolUser,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật thông tin school user
 * PUT /api/v1/system-admin/school-users/:id
 */
const updateSchoolUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      school_id,
      description,
    } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School user ID is required",
      });
    }

    const schoolUser = await schoolUsersService.updateSchoolUser(id, {
      school_id,
      description,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update school user successfully",
      data: schoolUser,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật thông tin user của school user
 * PUT /api/v1/system-admin/school-users/:id/user
 */
const updateSchoolUserUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_name,
      full_name,
      email,
      phone_number,
      address,
    } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School user ID is required",
      });
    }

    const user = await schoolUsersService.updateSchoolUserUser(id, {
      user_name,
      full_name,
      email,
      phone_number,
      address,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update school user info successfully",
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
 * Xóa school user
 * DELETE /api/v1/system-admin/school-users/:id
 */
const deleteSchoolUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteUser } = req.query; // ?deleteUser=true to also delete user account

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School user ID is required",
      });
    }

    const result = await schoolUsersService.deleteSchoolUser(id, {
      deleteUser: deleteUser === 'true',
    });

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
  getAllSchoolUsers,
  getSchoolUserById,
  createSchoolUser,
  updateSchoolUser,
  updateSchoolUserUser,
  deleteSchoolUser,
};