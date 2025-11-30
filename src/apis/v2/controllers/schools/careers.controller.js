const { StatusCodes } = require("http-status-codes");
const careersService = require("../../services/schools/careers.service");
const baseCareersService = require("../../../v1/services/careers-manage/career.service");
const baseCriteriaService = require("../../../v1/services/careers-manage/career-criteria.service");
const baseClassCriteriaConfigService = require("../../../v1/services/school-manage/careerClassConfig.service");
/**
 * List all active careers that the authenticated school currently holds a license for. Supports pagination + optional filtering by career categories.
 */
const getActiveCareersForSchool = async (req, res) => {
  try {
    const { limit, skip, page } = req.pagination;
    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder || "desc";
    const school_id = req.schoolUser?.school_id;

    if (!school_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "school_id is required",
      });
    }

    const categoryIds = req.query.category_ids
      ? req.query.category_ids
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id)
      : [];

    const result = await careersService.getActiveCareersForSchool({
      school_id,
      categoryIds,
      paging: { skip, limit },
      orderBy: { [sortBy]: sortOrder },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get active careers successfully",
      data: result.data,
      meta: {
        total: result.meta.total,
        page,
        limit,
        totalPages: Math.ceil(result.meta.total / limit),
      },
    });
  } catch (error) {
    if (error.message.includes("not found")) {
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
 * Retrieve a single career with background image and category metadata using the v1 career service.
 */
const getCareerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career ID is required",
      });
    }

    const career = await baseCareersService.getCareerById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career successfully",
      data: career,
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

/**
 * List career criteria for a specific career with optional search and is_active filtering. Career ID is required.
 */
const getCriteriaByCareerId = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search } = req.query;
    const { career_id } = req.params;

    if (!career_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "career_id is required",
      });
    }

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    filters.career_id = { equals: career_id };
    filters.is_active = { equals: true };

    const result = await baseCriteriaService.getAllCareerCriteria({
      filters,
      paging: { skip, limit: 21 },
      orderBy: { order_index: "asc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all career criteria successfully",
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

/**
 * Return the configured criteria IDs for a class and career combination.
 */
const getConfigOfCareerCriteriaForClass = async (req, res) => {
  try {
    const { class_id, career_id } = req.query;

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

    const criteriaIds =
      await baseClassCriteriaConfigService.getClassCriteriaConfigList({
        class_id,
        career_id,
      });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get class criteria config list successfully",
      data: criteriaIds,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Bind a single criteria to a class and career (create association record).
 */
const configCareerCriteriaForClass = async (req, res) => {
  try {
    const { class_id, career_id, criteria_id } = req.body;

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

    if (!criteria_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "criteria_id is required",
      });
    }

    const newConfig =
      await baseClassCriteriaConfigService.createClassCriteriaConfig({
        class_id,
        career_id,
        criteria_id,
      });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create class criteria config successfully",
      data: newConfig,
    });
  } catch (error) {
    // Check if error is about duplicate record
    if (error.message.includes("already exists")) {
      return res.status(StatusCodes.CONFLICT).json({
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
 * Remove an assigned criteria from a class/career pair.
 */
const removeCareerCriteriaConfigForClass = async (req, res) => {
  try {
    const { class_id, career_id, criteria_id } = req.body;

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

    if (!criteria_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "criteria_id is required",
      });
    }

    const result =
      await baseClassCriteriaConfigService.deleteClassCriteriaConfig({
        class_id,
        career_id,
        criteria_id,
      });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    // Check if error is about not found
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
  getActiveCareersForSchool,
  getCareerById,
  getCriteriaByCareerId,
  getCareerCriteriaById,
  getConfigOfCareerCriteriaForClass,
  configCareerCriteriaForClass,
  removeCareerCriteriaConfigForClass,
};
