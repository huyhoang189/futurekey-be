const questionCategoriesService = require("../../services/question-manage/questionCategories.service");
const asyncHandler = require("../../../../middlewares/handler/asyncHandler");

class QuestionCategoriesController {
  /**
   * @desc Get all question categories
   * @route GET /api/v1/question-manage/question-categories
   * @access Private (Admin/Teacher)
   */
  getAllCategories = asyncHandler(async (req, res) => {
    const { page, limit, search } = req.query;

    const result = await questionCategoriesService.getAllCategories({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  /**
   * @desc Get category by ID
   * @route GET /api/v1/question-manage/question-categories/:id
   * @access Private (Admin/Teacher)
   */
  getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await questionCategoriesService.getCategoryById(id);

    res.status(200).json({
      success: true,
      data: category,
    });
  });

  /**
   * @desc Create new category
   * @route POST /api/v1/question-manage/question-categories
   * @access Private (Admin/Teacher)
   */
  createCategory = asyncHandler(async (req, res) => {
    const created_by = req.userSession?.sub;

    const category = await questionCategoriesService.createCategory(req.body, created_by);

    res.status(201).json({
      success: true,
      data: category,
    });
  });

  /**
   * @desc Update category
   * @route PUT /api/v1/question-manage/question-categories/:id
   * @access Private (Admin/Teacher)
   */
  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await questionCategoriesService.updateCategory(id, req.body);

    res.status(200).json({
      success: true,
      data: category,
    });
  });

  /**
   * @desc Delete category
   * @route DELETE /api/v1/question-manage/question-categories/:id
   * @access Private (Admin/Teacher)
   */
  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await questionCategoriesService.deleteCategory(id);

    res.status(200).json({
      success: true,
      ...result,
    });
  });
}

module.exports = new QuestionCategoriesController();
