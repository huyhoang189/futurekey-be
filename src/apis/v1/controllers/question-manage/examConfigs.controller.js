const examConfigsService = require("../../services/question-manage/examConfigs.service");
const asyncHandler = require("../../../../middlewares/handler/asyncHandler");
const safeParse = require("../../../../utils/safeParse");

class ExamConfigsController {
  /**
   * @desc Get all exam configs
   * @route GET /api/v1/question-manage/exam-configs
   * @access Private (Admin/Teacher)
   */
  getAllExamConfigs = asyncHandler(async (req, res) => {
    const { page, limit, search, exam_type_scope } = req.query;

    const result = await examConfigsService.getAllExamConfigs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      exam_type_scope,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  /**
   * @desc Get exam config by ID
   * @route GET /api/v1/question-manage/exam-configs/:id
   * @access Private (Admin/Teacher)
   */
  getExamConfigById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const config = await examConfigsService.getExamConfigById(id);

    res.status(200).json({
      success: true,
      data: config,
    });
  });

  /**
   * @desc Create new exam config
   * @route POST /api/v1/question-manage/exam-configs
   * @access Private (Admin/Teacher)
   */
  createExamConfig = asyncHandler(async (req, res) => {
    const created_by = req.userSession?.sub;

    const config = await examConfigsService.createExamConfig(req.body, created_by);

    res.status(201).json({
      success: true,
      data: config,
    });
  });

  /**
   * @desc Update exam config
   * @route PUT /api/v1/question-manage/exam-configs/:id
   * @access Private (Admin/Teacher)
   */
  updateExamConfig = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const config = await examConfigsService.updateExamConfig(id, req.body);

    res.status(200).json({
      success: true,
      data: config,
    });
  });

  /**
   * @desc Delete exam config
   * @route DELETE /api/v1/question-manage/exam-configs/:id
   * @access Private (Admin/Teacher)
   */
  deleteExamConfig = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await examConfigsService.deleteExamConfig(id);

    res.status(200).json({
      success: true,
      ...result,
    });
  });
}

module.exports = new ExamConfigsController();
