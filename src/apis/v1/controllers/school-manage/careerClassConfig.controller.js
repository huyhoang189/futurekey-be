const { StatusCodes } = require("http-status-codes");
const careerClassConfigService = require("../../services/school-manage/careerClassConfig.service");

/**
 * Lấy danh sách criteria_id theo class_id và career_id
 * GET /api/v1/school-manage/class-criteria-config?class_id=xxx&career_id=xxx
 */
const getClassCriteriaConfigList = async (req, res) => {
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
      await careerClassConfigService.getClassCriteriaConfigList({
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
 * Tạo mới bản ghi class_criteria_config
 * POST /api/v1/school-manage/class-criteria-config
 */
const createClassCriteriaConfig = async (req, res) => {
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

    const newConfig = await careerClassConfigService.createClassCriteriaConfig({
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
 * Xóa bản ghi class_criteria_config theo class_id, career_id, criteria_id
 * DELETE /api/v1/school-manage/class-criteria-config
 */
const deleteClassCriteriaConfig = async (req, res) => {
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

    const result = await careerClassConfigService.deleteClassCriteriaConfig({
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
  getClassCriteriaConfigList,
  createClassCriteriaConfig,
  deleteClassCriteriaConfig,
};
