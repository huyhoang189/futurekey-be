const { StatusCodes } = require("http-status-codes");
const classesService = require("../../../v1/services/system-admin/classes.service");

/**
 * List classes owned by the school in the current session (supports pagination, search, grade_level filters).
 */
const getAllClasses = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, grade_level, name } = req.query;

    const school_id = req.schoolUser?.school_id;

    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "school_id is required",
      });
    }

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [{ name: { contains: search } }];
    }

    if (name) {
      filters.name = { contains: name };
    }

    if (school_id) {
      filters.school_id = school_id;
    }

    if (grade_level) {
      const gradeNumber = parseInt(grade_level);
      if (!isNaN(gradeNumber)) {
        filters.grade_level = gradeNumber;
      }
    }

    const result = await classesService.getAllClasses({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all classes successfully",
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
 * Lấy thông tin class theo ID
 */
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const classData = await classesService.getClassById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get class successfully",
      data: classData,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create a new class record scoped to the requesting school.
 */
const createClass = async (req, res) => {
  try {
    const school_id = req.schoolUser?.school_id;
    const { name, grade_level, homeroom_teacher_id } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class name is required",
      });
    }

    // Validate grade_level nếu có
    if (grade_level !== undefined && grade_level !== null) {
      const gradeNumber = parseInt(grade_level);
      if (isNaN(gradeNumber) || gradeNumber < 1 || gradeNumber > 12) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Grade level must be a number between 1 and 12",
        });
      }
    }

    const classData = await classesService.createClass({
      name,
      grade_level: grade_level ? parseInt(grade_level) : null,
      school_id,
      homeroom_teacher_id,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create class successfully",
      data: classData,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update class metadata such as name, grade level, or homeroom teacher.
 */
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.schoolUser?.school_id;
    const { name, grade_level, homeroom_teacher_id } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // Validate grade_level nếu có
    if (grade_level !== undefined && grade_level !== null) {
      const gradeNumber = parseInt(grade_level);
      if (isNaN(gradeNumber) || gradeNumber < 1 || gradeNumber > 12) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Grade level must be a number between 1 and 12",
        });
      }
    }

    const classData = await classesService.updateClass(id, {
      name,
      grade_level: grade_level ? parseInt(grade_level) : null,
      school_id,
      homeroom_teacher_id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update class successfully",
      data: classData,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete a class if there are no students currently mapped to it.
 */
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const result = await classesService.deleteClass(id);

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
 * List students that belong to the specified class with pagination support.
 */
const getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = req.pagination;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const result = await classesService.getClassStudents(id, { skip, limit });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get class students successfully",
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
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
  getClassById,
};
