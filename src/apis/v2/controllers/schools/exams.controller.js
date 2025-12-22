const { StatusCodes } = require("http-status-codes");
const examsService = require("../../services/schools/exams.service");

/**
 * Lay danh sach bai thi theo lop voi filter
 */
const getExamAttemptsByClass = async (req, res) => {
  try {
    const { limit, skip, page } = req.pagination;
    const { class_id, search, career_id, career_criteria_id, status } =
      req.query;

    if (!class_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "class_id is required",
      });
    }

    const sortBy = req.query.sortBy || "submit_time";
    const sortOrder = req.query.sortOrder || "desc";

    const result = await examsService.getExamAttemptsByClass({
      class_id,
      search,
      career_id,
      career_criteria_id,
      status,
      paging: { skip, limit },
      orderBy: { [sortBy]: sortOrder },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get exam attempts successfully",
      data: result.data,
      meta: {
        total: result.meta.total,
        page,
        limit,
        totalPages: Math.ceil(result.meta.total / limit),
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
 * Lay chi tiet bai thi theo attemptId (khong gioi han theo hoc sinh)
 */
const getAttemptDetailsById = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const result = await examsService.getAttemptDetailsById(attemptId);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status =
      error.message === "Attempt not found"
        ? StatusCodes.NOT_FOUND
        : StatusCodes.INTERNAL_SERVER_ERROR;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cham cau hoi tu luan / short answer
 */
const gradeAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { earned_score, feedback } = req.body;
    const grader_id = req.userSession?.sub || null;

    const result = await examsService.gradeAnswer({
      answerId,
      earned_score,
      feedback,
      grader_id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status =
      error.message === "Answer not found" ||
      error.message === "Attempt not found"
        ? StatusCodes.NOT_FOUND
        : StatusCodes.BAD_REQUEST;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getExamAttemptsByClass,
  getAttemptDetailsById,
  gradeAnswer,
};
