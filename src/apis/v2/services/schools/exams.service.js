const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy danh sách đề thi
 */
const getAllExams = async ({ filters = {}, paging = {}, orderBy = {}, search = '' }) => {
  const { skip = 0, limit = 10 } = paging;

  // Search logic
  if (search) {
    if (!filters.OR) {
      filters.OR = [];
    }
    filters.OR.push(
      { title: { contains: search } },
      { description: { contains: search } }
    );
  }

  const total = await prisma.exams.count({
    where: filters,
  });

  const data = await prisma.exams.findMany({
    where: filters,
    skip,
    take: limit,
    orderBy: orderBy,
  });

  // Join with related data
  if (data.length > 0) {
    const classIds = [...new Set(data.map(e => e.class_id).filter(Boolean))];
    const creatorIds = [...new Set(data.map(e => e.created_by).filter(Boolean))];

    const [classes, creators] = await Promise.all([
      classIds.length > 0 ? prisma.classes.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true },
      }) : [],
      creatorIds.length > 0 ? prisma.auth_base_user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, full_name: true },
      }) : [],
    ]);

    const classesMap = Object.fromEntries(classes.map(c => [c.id, c]));
    const creatorsMap = Object.fromEntries(creators.map(c => [c.id, c]));

    data.forEach(exam => {
      exam.class = exam.class_id ? classesMap[exam.class_id] || null : null;
      exam.creator = exam.created_by ? creatorsMap[exam.created_by] || null : null;
    });
  }

  return {
    data,
    meta: {
      total,
      skip,
      limit,
    },
  };
};

/**
 * Lấy đề thi theo ID
 */
const getExamById = async (id) => {
  const exam = await prisma.exams.findUnique({
    where: { id },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  // Join with related data
  const [classInfo, creator, distributions, examQuestions] = await Promise.all([
    exam.class_id ? prisma.classes.findUnique({
      where: { id: exam.class_id },
      select: { id: true, name: true },
    }) : null,
    exam.created_by ? prisma.auth_base_user.findUnique({
      where: { id: exam.created_by },
      select: { id: true, full_name: true },
    }) : null,
    prisma.exam_question_distributions.findMany({
      where: { exam_id: id },
    }),
    prisma.exam_questions.findMany({
      where: { exam_id: id },
      orderBy: { order_index: 'asc' },
    }),
  ]);

  exam.class = classInfo;
  exam.creator = creator;
  exam.distributions = distributions;
  exam.exam_questions = examQuestions;

  return exam;
};

/**
 * Tạo đề thi mới
 */
const createExam = async (examData) => {
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
    created_by,
    is_published,
    distributions, // Array of question distributions
  } = examData;

  // Validate class
  const classInfo = await prisma.classes.findUnique({
    where: { id: class_id },
  });

  if (!classInfo) {
    throw new Error("Class not found");
  }

  // Create exam with distributions in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const exam = await tx.exams.create({
      data: {
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
      },
    });

    // Create distributions if provided
    if (distributions && distributions.length > 0) {
      await tx.exam_question_distributions.createMany({
        data: distributions.map(dist => ({
          exam_id: exam.id,
          category_id: dist.category_id,
          career_criteria_id: dist.career_criteria_id,
          question_type: dist.question_type,
          difficulty_level: dist.difficulty_level,
          quantity: dist.quantity,
          easy_count: dist.easy_count || 0,
          medium_count: dist.medium_count || 0,
          hard_count: dist.hard_count || 0,
          points_per_question: dist.points_per_question,
          order_index: dist.order_index,
        })),
      });
    }

    return exam;
  });

  return result;
};

/**
 * Cập nhật đề thi
 */
const updateExam = async (id, updateData) => {
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
  } = updateData;

  // Check if exam exists
  const existing = await prisma.exams.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Exam not found");
  }

  // Validate class if being updated
  if (class_id !== undefined && class_id !== null) {
    const classInfo = await prisma.classes.findUnique({
      where: { id: class_id },
    });

    if (!classInfo) {
      throw new Error("Class not found");
    }
  }

  const exam = await prisma.exams.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(class_id !== undefined && { class_id }),
      ...(exam_type !== undefined && { exam_type }),
      ...(duration_minutes !== undefined && { duration_minutes }),
      ...(total_points !== undefined && { total_points }),
      ...(passing_score !== undefined && { passing_score }),
      ...(start_time !== undefined && { start_time }),
      ...(end_time !== undefined && { end_time }),
      ...(instructions !== undefined && { instructions }),
      ...(is_shuffle_questions !== undefined && { is_shuffle_questions }),
      ...(is_shuffle_options !== undefined && { is_shuffle_options }),
      ...(show_results_immediately !== undefined && { show_results_immediately }),
      ...(max_attempts !== undefined && { max_attempts }),
      ...(is_published !== undefined && { is_published }),
    },
  });

  return exam;
};

/**
 * Xóa đề thi
 */
const deleteExam = async (id) => {
  // Check if exam has student attempts
  const attempt = await prisma.student_exam_attempts.findFirst({
    where: { exam_id: id },
  });

  if (attempt) {
    throw new Error("Cannot delete exam. Students have already attempted it");
  }

  // Delete exam with all related data
  await prisma.$transaction(async (tx) => {
    await tx.exam_questions.deleteMany({ where: { exam_id: id } });
    await tx.exam_question_distributions.deleteMany({ where: { exam_id: id } });
    await tx.exams.delete({ where: { id } });
  });

  return { message: "Exam deleted successfully" };
};

/**
 * Cập nhật phân phối câu hỏi cho đề thi
 */
const updateExamDistributions = async (examId, distributions) => {
  const exam = await prisma.exams.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  // Check if exam has attempts
  const attempt = await prisma.student_exam_attempts.findFirst({
    where: { exam_id: examId },
  });

  if (attempt) {
    throw new Error("Cannot update distributions. Students have already attempted this exam");
  }

  await prisma.$transaction(async (tx) => {
    // Delete existing distributions
    await tx.exam_question_distributions.deleteMany({
      where: { exam_id: examId },
    });

    // Create new distributions
    if (distributions && distributions.length > 0) {
      await tx.exam_question_distributions.createMany({
        data: distributions.map(dist => ({
          exam_id: examId,
          category_id: dist.category_id,
          career_criteria_id: dist.career_criteria_id,
          question_type: dist.question_type,
          difficulty_level: dist.difficulty_level,
          quantity: dist.quantity,
          easy_count: dist.easy_count || 0,
          medium_count: dist.medium_count || 0,
          hard_count: dist.hard_count || 0,
          points_per_question: dist.points_per_question,
          order_index: dist.order_index,
        })),
      });
    }
  });

  return { message: "Exam distributions updated successfully" };
};

/**
 * Tạo câu hỏi cho đề thi dựa trên phân phối
 */
const generateExamQuestions = async (examId) => {
  const exam = await prisma.exams.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  // Get distributions ordered by order_index
  const distributions = await prisma.exam_question_distributions.findMany({
    where: { exam_id: examId },
    orderBy: { order_index: 'asc' },
  });

  if (distributions.length === 0) {
    throw new Error("No question distributions found for this exam");
  }

  // Check if exam already has questions
  const existingQuestions = await prisma.exam_questions.count({
    where: { exam_id: examId },
  });

  if (existingQuestions > 0) {
    throw new Error("Exam already has questions. Delete them first to regenerate");
  }

  const selectedQuestions = [];
  const questionIdsToUpdate = [];
  let orderIndex = 1;

  for (const dist of distributions) {
    const questionsForDist = [];

    // Random theo từng độ khó nếu có phân bổ
    const difficulties = [
      { level: 'EASY', count: dist.easy_count || 0 },
      { level: 'MEDIUM', count: dist.medium_count || 0 },
      { level: 'HARD', count: dist.hard_count || 0 },
    ];

    for (const { level, count } of difficulties) {
      if (count > 0) {
        const filter = {
          is_active: true,
          difficulty_level: level,
          ...(dist.category_id && { category_id: dist.category_id }),
          ...(dist.career_criteria_id && { career_criteria_id: dist.career_criteria_id }),
          ...(dist.question_type && { question_type: dist.question_type }),
        };

        // Ưu tiên câu ít dùng
        const available = await prisma.questions.findMany({
          where: filter,
          orderBy: { usage_count: 'asc' },
        });

        if (available.length < count) {
          throw new Error(`Not enough ${level} questions. Required: ${count}, Available: ${available.length}`);
        }

        // Randomly select from top candidates
        const shuffled = available.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        
        questionsForDist.push(...selected);
        questionIdsToUpdate.push(...selected.map(q => q.id));
      }
    }

    // Nếu không có phân bổ cụ thể, random theo quantity
    if (questionsForDist.length === 0 && dist.quantity > 0) {
      const filter = {
        is_active: true,
        ...(dist.category_id && { category_id: dist.category_id }),
        ...(dist.career_criteria_id && { career_criteria_id: dist.career_criteria_id }),
        ...(dist.question_type && { question_type: dist.question_type }),
        ...(dist.difficulty_level && { difficulty_level: dist.difficulty_level }),
      };

      const available = await prisma.questions.findMany({
        where: filter,
        orderBy: { usage_count: 'asc' },
      });

      if (available.length < dist.quantity) {
        throw new Error(`Not enough questions. Required: ${dist.quantity}, Available: ${available.length}`);
      }

      const shuffled = available.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, dist.quantity);
      
      questionsForDist.push(...selected);
      questionIdsToUpdate.push(...selected.map(q => q.id));
    }

    // Add to exam questions
    questionsForDist.forEach(question => {
      selectedQuestions.push({
        exam_id: examId,
        question_id: question.id,
        order_index: orderIndex++,
        points: dist.points_per_question,
      });
    });
  }

  // Create exam questions and update usage_count in transaction
  await prisma.$transaction(async (tx) => {
    await tx.exam_questions.createMany({
      data: selectedQuestions,
    });

    // Update usage_count for selected questions
    if (questionIdsToUpdate.length > 0) {
      await tx.questions.updateMany({
        where: { id: { in: questionIdsToUpdate } },
        data: { usage_count: { increment: 1 } },
      });
    }
  });

  return { message: `Generated ${selectedQuestions.length} questions for exam`, count: selectedQuestions.length };
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
