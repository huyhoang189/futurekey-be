const questionsService = require("../../services/question-manage/questions.service");

/**
 * @swagger
 * /api/v1/system-admin/questions:
 *   get:
 *     tags: [Questions]
 *     summary: Lấy danh sách câu hỏi
 */
const getAllQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category_id,
      career_criteria_id,
      question_type,
      difficulty_level,
      is_active,
    } = req.query;

    const filters = {};
    if (category_id) filters.category_id = category_id;
    if (career_criteria_id) filters.career_criteria_id = career_criteria_id;
    if (question_type) filters.question_type = question_type;
    if (difficulty_level) filters.difficulty_level = difficulty_level;
    if (is_active !== undefined) filters.is_active = is_active === "true";

    const paging = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const orderBy = { created_at: "desc" };

    const result = await questionsService.getAllQuestions({
      filters,
      paging,
      orderBy,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        ...result.meta,
        page,
      },
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
 * /api/v1/system-admin/questions/{id}:
 *   get:
 *     tags: [Questions]
 *     summary: Lấy câu hỏi theo ID
 */
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await questionsService.getQuestionById(id);

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    return res.status(error.message === "Question not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/questions:
 *   post:
 *     tags: [Questions]
 *     summary: Tạo câu hỏi mới
 */
const createQuestion = async (req, res) => {
  try {
    const {
      category_id,
      career_criteria_id,
      question_type,
      difficulty_level,
      content,
      options,
      explanation,
      points,
      time_limit,
      tags,
      metadata,
      is_active,
    } = req.body;

    const created_by = req.userSession.sub; // JWT payload sử dụng 'sub' field

    const question = await questionsService.createQuestion({
      category_id,
      career_criteria_id,
      question_type,
      difficulty_level,
      content,
      options,
      explanation,
      points,
      time_limit,
      tags,
      metadata,
      created_by,
      is_active,
    });

    return res.status(201).json({
      success: true,
      data: question,
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
 * /api/v1/system-admin/questions/{id}:
 *   put:
 *     tags: [Questions]
 *     summary: Cập nhật câu hỏi
 */
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      career_criteria_id,
      question_type,
      difficulty_level,
      content,
      options,
      explanation,
      points,
      time_limit,
      is_active,
    } = req.body;

    const question = await questionsService.updateQuestion(id, {
      category_id,
      career_criteria_id,
      question_type,
      difficulty_level,
      content,
      options,
      explanation,
      points,
      time_limit,
      is_active,
    });

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    return res.status(error.message === "Question not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/questions/{id}:
 *   delete:
 *     tags: [Questions]
 *     summary: Xóa câu hỏi
 */
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await questionsService.deleteQuestion(parseInt(id));

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
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
