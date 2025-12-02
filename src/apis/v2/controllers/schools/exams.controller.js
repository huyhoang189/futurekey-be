const examsService = require("../../services/schools/exams.service");

/**
 * @swagger
 * /api/v1/system-admin/exams:
 *   get:
 *     tags: [Exams]
 *     summary: Lấy danh sách đề thi
 */
const getAllExams = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      class_id,
      exam_type,
      is_published
    } = req.query;

    const filters = {};
    if (class_id) filters.class_id = parseInt(class_id);
    if (exam_type) filters.exam_type = exam_type;
    if (is_published !== undefined) filters.is_published = is_published === 'true';

    const paging = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const orderBy = { created_at: 'desc' };

    const result = await examsService.getAllExams({
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
 * /api/v1/system-admin/exams/{id}:
 *   get:
 *     tags: [Exams]
 *     summary: Lấy đề thi theo ID
 */
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await examsService.getExamById(parseInt(id));

    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    return res.status(error.message === "Exam not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/exams:
 *   post:
 *     tags: [Exams]
 *     summary: Tạo đề thi mới
 */
const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      class_id,
      exam_type,
      duration_minutes,
      total_points,
      passing_score,
      start_time,
      end_time,
      instructions,
      is_shuffle_questions,
      is_shuffle_options,
      show_results_immediately,
      max_attempts,
      is_published,
      distributions,
    } = req.body;

    const created_by = req.user.id;

    const exam = await examsService.createExam({
      title,
      description,
      class_id,
      exam_type,
      duration_minutes,
      total_points,
      passing_score,
      start_time,
      end_time,
      instructions,
      is_shuffle_questions,
      is_shuffle_options,
      show_results_immediately,
      max_attempts,
      created_by,
      is_published,
      distributions,
    });

    return res.status(201).json({
      success: true,
      data: exam,
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
 * /api/v1/system-admin/exams/{id}:
 *   put:
 *     tags: [Exams]
 *     summary: Cập nhật đề thi
 */
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      class_id,
      exam_type,
      duration_minutes,
      total_points,
      passing_score,
      start_time,
      end_time,
      instructions,
      is_shuffle_questions,
      is_shuffle_options,
      show_results_immediately,
      max_attempts,
      is_published,
    } = req.body;

    const exam = await examsService.updateExam(parseInt(id), {
      title,
      description,
      class_id,
      exam_type,
      duration_minutes,
      total_points,
      passing_score,
      start_time,
      end_time,
      instructions,
      is_shuffle_questions,
      is_shuffle_options,
      show_results_immediately,
      max_attempts,
      is_published,
    });

    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    return res.status(error.message === "Exam not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/exams/{id}:
 *   delete:
 *     tags: [Exams]
 *     summary: Xóa đề thi
 */
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await examsService.deleteExam(parseInt(id));

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.message.includes("already attempted") ? 400 : 404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/exams/{id}/distributions:
 *   put:
 *     tags: [Exams]
 *     summary: Cập nhật phân phối câu hỏi cho đề thi
 */
const updateExamDistributions = async (req, res) => {
  try {
    const { id } = req.params;
    const { distributions } = req.body;

    const result = await examsService.updateExamDistributions(parseInt(id), distributions);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.message.includes("already attempted") ? 400 : 404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/v1/system-admin/exams/{id}/generate-questions:
 *   post:
 *     tags: [Exams]
 *     summary: Tạo câu hỏi cho đề thi dựa trên phân phối
 */
const generateExamQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await examsService.generateExamQuestions(parseInt(id));

    return res.status(200).json({
      success: true,
      message: result.message,
      data: { count: result.count },
    });
  } catch (error) {
    return res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  updateExamDistributions,
  generateExamQuestions,
};
