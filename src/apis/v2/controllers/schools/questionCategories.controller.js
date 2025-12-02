const questionCategoriesService = require("../../services/schools/questionCategories.service");

/**
 * @swagger
 * /api/v1/system-admin/question-categories:
 *   get:
 *     tags: [Question Categories]
 *     summary: Lấy danh sách danh mục câu hỏi
 */
const getAllQuestionCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', is_active } = req.query;

    const filters = {};
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true';
    }

    const paging = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const orderBy = { created_at: 'desc' };

    const result = await questionCategoriesService.getAllQuestionCategories({
      filters,
      paging,
      orderBy,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/question-categories/{id}:
 *   get:
 *     tags: [Question Categories]
 *     summary: Lấy danh mục câu hỏi theo ID
 */
const getQuestionCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await questionCategoriesService.getQuestionCategoryById(parseInt(id));

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(error.message === "Question category not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/question-categories:
 *   post:
 *     tags: [Question Categories]
 *     summary: Tạo danh mục câu hỏi mới
 */
const createQuestionCategory = async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    const created_by = req.user.id;

    const category = await questionCategoriesService.createQuestionCategory({
      name,
      description,
      created_by,
      is_active,
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/question-categories/{id}:
 *   put:
 *     tags: [Question Categories]
 *     summary: Cập nhật danh mục câu hỏi
 */
const updateQuestionCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const category = await questionCategoriesService.updateQuestionCategory(parseInt(id), {
      name,
      description,
      is_active,
    });

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(error.message === "Question category not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/question-categories/{id}:
 *   delete:
 *     tags: [Question Categories]
 *     summary: Xóa danh mục câu hỏi
 */
const deleteQuestionCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await questionCategoriesService.deleteQuestionCategory(parseInt(id));

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.message.includes("being used") ? 400 : 404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllQuestionCategories,
  getQuestionCategoryById,
  createQuestionCategory,
  updateQuestionCategory,
  deleteQuestionCategory,
};
