const { StatusCodes } = require("http-status-codes");
const studentsService = require("../../../v1/services/system-admin/students.service");
const path = require("path");
const fs = require("fs");

const ALLOWED_SEX_VALUES = ["OTHER", "MALE", "FEMALE"];

/**
 * List school users scoped to the current school context. Supports pagination and optional search.
 */
const getAllStudents = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, class_id, sex } = req.query;

    if (!class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    const filters = {
      class_id,
    };

    if (sex) {
      filters.sex = sex;
    }

    if (search) {
      filters.OR = [{ description: { contains: search } }];
    }

    const result = await studentsService.getAllStudents({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
      search,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get students for class successfully",
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
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School user ID is required",
      });
    }

    const student = await studentsService.getStudentById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get school user successfully",
      data: student,
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
const createStudent = async (req, res) => {
  try {
    const {
      user_name,
      full_name,
      email,
      phone_number,
      password,
      address,
      class_id,
      sex,
      birthday,
      description,
      major_interest,
    } = req.body;

    const school_id = req.schoolUser?.school_id;

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
        message: "school_id is required",
      });
    }

    if (!class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    if (sex && !ALLOWED_SEX_VALUES.includes(sex)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid sex value. Must be OTHER, MALE, or FEMALE",
      });
    }

    if (birthday) {
      const birthDate = new Date(birthday);
      if (Number.isNaN(birthDate.getTime())) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid birthday format",
        });
      }

      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 5 || age > 25) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message:
            "Invalid birthday. Student age must be between 5 and 25 years old",
        });
      }
    }

    const result = await studentsService.createStudent({
      user_name,
      full_name,
      email,
      phone_number,
      password,
      address,
      school_id,
      class_id,
      sex,
      birthday,
      description,
      major_interest,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create student successfully",
      data: result.student,
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
      "../../../../template/template_import_student.xlsx"
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
const importStudents = async (req, res) => {
  try {
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
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

    const result = await studentsService.importStudents(
      req.file.buffer,
      class_id
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
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { student: studentUpdates, base_user } = req.body;
    const school_id = req.schoolUser?.school_id;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
    }

    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "school_id is required",
      });
    }

    if (
      studentUpdates?.sex &&
      !ALLOWED_SEX_VALUES.includes(studentUpdates.sex)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid sex value. Must be OTHER, MALE, or FEMALE",
      });
    }

    if (studentUpdates?.birthday) {
      const birthDate = new Date(studentUpdates.birthday);
      if (Number.isNaN(birthDate.getTime())) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid birthday format",
        });
      }

      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 5 || age > 25) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message:
            "Invalid birthday. Student age must be between 5 and 25 years old",
        });
      }
    }

    const payload = {};
    if (studentUpdates) {
      payload.student = {
        ...studentUpdates,
        school_id,
      };
    }

    if (base_user) {
      payload.base_user = base_user;
    }

    if (!payload.student && !payload.base_user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "No update data provided",
      });
    }

    const result = await studentsService.updateStudent(id, payload);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update student successfully",
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
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School user ID is required",
      });
    }

    const result = await studentsService.deleteStudent(id, {
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
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  downloadTemplate,
  importStudents,
};
