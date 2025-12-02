const { StatusCodes } = require("http-status-codes");
const careersService = require("../../services/students/careers.service");
const baseCriteriaService = require("../../../v1/services/careers-manage/career-criteria.service");
const getConfiguredCareersForStudent = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, category_ids } = req.query;
    const student = req.student;

    const class_id = student?.class_id;

    if (!class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    const categoryIds = category_ids
      ? category_ids
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id)
      : [];

    const result = await careersService.getCareersForStudent({
      class_id,
      filters: {
        search,
        categoryIds,
      },
      paging: { skip, limit },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get configured careers for student",
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

const getConfiguredCriteriaForCareer = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search } = req.query;
    const { career_id } = req.params;
    const student = req.student;

    const class_id = student?.class_id;

    if (!class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    if (!career_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "career_id is required",
      });
    }

    const result = await careersService.getConfiguredCriteriaForCareer({
      class_id,
      career_id,
      student_id: student.id,
      filters: { search },
      paging: { skip, limit: 21 },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get configured criteria successfully",
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

const getConfiguredCareerById = async (req, res) => {
  try {
    const { career_id } = req.params;
    const student = req.student;

    const class_id = student?.class_id;

    if (!class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    if (!career_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "career_id is required",
      });
    }

    const career = await careersService.getConfiguredCareerById({
      class_id,
      career_id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career successfully",
      data: career,
    });
  } catch (error) {
    if (
      error.message.includes("not configured") ||
      error.message.includes("not found")
    ) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("required")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get a single career criteria entry (with career details) by ID.
 */
const getCareerCriteriaById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career criteria ID is required",
      });
    }

    const criteria = await baseCriteriaService.getCareerCriteriaById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career criteria successfully",
      data: criteria,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getConfiguredCareersForStudent,
  getConfiguredCriteriaForCareer,
  getCareerCriteriaById,
  getConfiguredCareerById,
};
