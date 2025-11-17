const { StatusCodes } = require("http-status-codes");
const studentsService = require("../../services/system-admin/students.service");

/**
 * Lấy danh sách students
 * GET /api/v1/system-admin/students?page=1&limit=10
 */
const getAllStudents = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, school_id, class_id, sex, grade_level } = req.query;

    // Build filters - chỉ search trong bảng auth_impl_user_student
    const filters = {};

    if (search) {
      filters.OR = [
        { description: { contains: search } },
        { major_interest: { contains: search } },
      ];
    }

    if (school_id) {
      filters.school_id = school_id;
    }

    if (class_id) {
      filters.class_id = class_id;
    }

    if (sex && ['OTHER', 'MALE', 'FEMALE'].includes(sex)) {
      filters.sex = sex;
    }

    const result = await studentsService.getAllStudents({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
      search, // Pass search để service xử lý manual search trong user/school/class
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all students successfully",
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
 * Lấy thông tin student theo ID
 * GET /api/v1/system-admin/students/:id
 */
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const student = await studentsService.getStudentById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get student successfully",
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
 * Tạo mới student (tự động tạo user account)
 * POST /api/v1/system-admin/students
 */
const createStudent = async (req, res) => {
  try {
    const {
      // User fields
      user_name,
      full_name,
      email,
      phone_number,
      password,
      address,
      // Student fields
      school_id,
      class_id,
      sex,
      birthday,
      description,
      major_interest,
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

    // Validate sex enum
    if (sex && !['OTHER', 'MALE', 'FEMALE'].includes(sex)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid sex value. Must be OTHER, MALE, or FEMALE",
      });
    }

    // Validate birthday
    if (birthday) {
      const birthDate = new Date(birthday);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      
      if (age < 5 || age > 25) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid birthday. Student age must be between 5 and 25 years old",
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
 * Cập nhật thông tin student
 * PUT /api/v1/system-admin/students/:id
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Validate sex enum if provided
    if (updateData.student?.sex && !['OTHER', 'MALE', 'FEMALE'].includes(updateData.student.sex)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid sex value. Must be OTHER, MALE, or FEMALE",
      });
    }

    // Validate birthday if provided
    if (updateData.student?.birthday) {
      const birthDate = new Date(updateData.student.birthday);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      
      if (age < 5 || age > 25) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid birthday. Student age must be between 5 and 25 years old",
        });
      }
    }

    const student = await studentsService.updateStudent(id, updateData);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update student successfully",
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
 * Cập nhật thông tin user của student
 * PUT /api/v1/system-admin/students/:id/user
 */
const updateStudentUser = async (req, res) => {
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
        message: "Student ID is required",
      });
    }

    const user = await studentsService.updateStudentUser(id, {
      user_name,
      full_name,
      email,
      phone_number,
      address,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update student user info successfully",
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
 * Xóa student
 * DELETE /api/v1/system-admin/students/:id
 */
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteUser } = req.query; // ?deleteUser=true to also delete user account

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const result = await studentsService.deleteStudent(id, {
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
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  updateStudentUser,
  deleteStudent,
};