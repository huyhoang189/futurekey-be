const { StatusCodes } = require("http-status-codes");
const schoolUsersService = require("../../../v1/services/system-admin/schoolUsers.service");
const path = require("path");
const fs = require("fs");

/**
 * List school users scoped to the current school context. Supports pagination and optional search.
 */
const getAllSchoolUsers = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search } = req.query;
    const school_id = req.schoolUser?.school_id;

    // Build filters - chỉ search trong bảng auth_impl_user_school
    const filters = {};

    if (search) {
      filters.OR = [{ description: { contains: search } }];
    }

    if (school_id) {
      filters.school_id = school_id;
    }

    const result = await schoolUsersService.getAllSchoolUsers({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
      search, // Pass search để service xử lý manual search trong user/school
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
 * Retrieve a single school user by its ID.
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
 * Create a new school user and the associated auth_base_user record.
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
      description,
    } = req.body;

    const school_id = req.schoolUser?.school_id;

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
 * Download the Excel template used for importing teachers.
 */
const downloadTemplate = async (req, res) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../../../../template/template_import_teacher.xlsx"
    );

    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Template file not found",
      });
    }

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template_import_teacher.xlsx"
    );

    // Send file
    return res.sendFile(templatePath);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Import school users (teachers) from an uploaded Excel file.
 */
const importSchoolUsers = async (req, res) => {
  try {
    const school_id = req.schoolUser?.school_id;

    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "school_id is required",
      });
    }

    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "File is required",
      });
    }

    // Validate file type
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Only Excel files (.xlsx, .xls) are allowed",
      });
    }

    const result = await schoolUsersService.importSchoolUsers(
      req.file.buffer,
      school_id
    );

    // Nếu có lỗi và có file lỗi, trả về file Excel với các row bị lỗi
    if (result.errorFileBuffer) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `import_teachers_errors_${timestamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"${filename}\"`
      );
      return res.send(result.errorFileBuffer);
    }

    // Nếu không có lỗi, trả về kết quả JSON
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Import completed",
      data: result,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update school user metadata and optionally update the linked base user fields.
 */
const updateSchoolUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_user, base_user } = req.body;
    const school_id = req.schoolUser?.school_id;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School user ID is required",
      });
    }

    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "school_id is required",
      });
    }

    const result = await schoolUsersService.updateSchoolUser(id, {
      school_user: { ...school_user, school_id },
      base_user,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update school user successfully",
      data: result,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete a school user entry, optionally removing the user account.
 */
const deleteSchoolUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School user ID is required",
      });
    }

    const result = await schoolUsersService.deleteSchoolUser(id, {
      deleteUser: true,
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
  deleteSchoolUser,
  downloadTemplate,
  importSchoolUsers,
};
