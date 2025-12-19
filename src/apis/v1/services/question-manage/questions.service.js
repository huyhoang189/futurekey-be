const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy danh sách câu hỏi
 */
const getAllQuestions = async ({
  filters = {},
  paging = {},
  orderBy = {},
  search = "",
}) => {
  const { skip = 0, limit = 10 } = paging;

  if (search) {
    if (!filters.OR) {
      filters.OR = [];
    }
    filters.OR.push(
      { content: { contains: search } },
      { tags: { contains: search } }
    );
  }

  const total = await prisma.questions.count({ where: filters });

  const data = await prisma.questions.findMany({
    where: filters,
    skip,
    take: limit,
    orderBy: orderBy,
  });

  if (data.length > 0) {
    const categoryIds = [
      ...new Set(data.map((q) => q.category_id).filter(Boolean)),
    ];
    const criteriaIds = [
      ...new Set(data.map((q) => q.career_criteria_id).filter(Boolean)),
    ];
    const creatorIds = [
      ...new Set(data.map((q) => q.created_by).filter(Boolean)),
    ];

    const [categories, criteria, creators] = await Promise.all([
      categoryIds.length > 0
        ? prisma.question_categories.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [],
      criteriaIds.length > 0
        ? prisma.career_criteria.findMany({
            where: { id: { in: criteriaIds } },
            select: { id: true, name: true },
          })
        : [],
      creatorIds.length > 0
        ? prisma.auth_base_user.findMany({
            where: { id: { in: creatorIds } },
            select: { id: true, full_name: true },
          })
        : [],
    ]);

    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const criteriaMap = Object.fromEntries(criteria.map((c) => [c.id, c]));
    const creatorsMap = Object.fromEntries(creators.map((c) => [c.id, c]));

    data.forEach((question) => {
      question.category = question.category_id
        ? categoryMap[question.category_id] || null
        : null;
      question.career_criteria = question.career_criteria_id
        ? criteriaMap[question.career_criteria_id] || null
        : null;
      question.creator = question.created_by
        ? creatorsMap[question.created_by] || null
        : null;
    });
  }

  return { data, meta: { total, skip, limit } };
};

const getQuestionById = async (id) => {
  const question = await prisma.questions.findUnique({ where: { id } });
  if (!question) throw new Error("Question not found");

  const [category, criteria, creator, options] = await Promise.all([
    question.category_id
      ? prisma.question_categories.findUnique({
          where: { id: question.category_id },
          select: { id: true, name: true },
        })
      : null,
    question.career_criteria_id
      ? prisma.career_criteria.findUnique({
          where: { id: question.career_criteria_id },
          select: { id: true, name: true, career_id: true },
        })
      : null,

    question.created_by
      ? prisma.auth_base_user.findUnique({
          where: { id: question.created_by },
          select: { id: true, full_name: true },
        })
      : null,
    prisma.question_options.findMany({
      where: { question_id: id },
      orderBy: { order_index: "asc" },
    }),
  ]);

  question.category = category;
  question.career_criteria = criteria;
  question.creator = creator;
  question.options = options;

  return question;
};

const createQuestion = async (questionData) => {
  const {
    content,
    question_type,
    difficulty_level,
    category_id,
    career_criteria_id,
    points,
    explanation,
    tags,
    metadata,
    is_active,
    created_by,
    options,
  } = questionData;

  if (category_id) {
    const category = await prisma.question_categories.findUnique({
      where: { id: category_id },
    });
    if (!category) throw new Error("Question category not found");
  }

  if (career_criteria_id) {
    const criteria = await prisma.career_criteria.findUnique({
      where: { id: career_criteria_id },
    });
    if (!criteria) throw new Error("Career criteria not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    const question = await tx.questions.create({
      data: {
        content,
        question_type,
        difficulty_level,
        category_id,
        career_criteria_id,
        points,
        explanation,
        tags,
        metadata,
        is_active,
        created_by,
      },
    });

    if (options && options.length > 0) {
      await tx.question_options.createMany({
        data: options.map((opt, idx) => ({
          question_id: question.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct || false,
          order_index: opt.order_index ?? idx,
        })),
      });
    }

    // Lấy lại question kèm options
    const questionWithOptions = await tx.questions.findUnique({
      where: { id: question.id },
    });

    const questionOptions = await tx.question_options.findMany({
      where: { question_id: question.id },
      orderBy: { order_index: "asc" },
    });

    return { ...questionWithOptions, options: questionOptions };
  });

  return result;
};

const updateQuestion = async (id, updateData) => {
  const {
    content,
    question_type,
    difficulty_level,
    category_id,
    career_criteria_id,
    points,
    explanation,
    tags,
    metadata,
    is_active,
    options,
  } = updateData;

  const existing = await prisma.questions.findUnique({ where: { id } });
  if (!existing) throw new Error("Question not found");

  if (category_id !== undefined && category_id !== null) {
    const category = await prisma.question_categories.findUnique({
      where: { id: category_id },
    });
    if (!category) throw new Error("Question category not found");
  }

  if (career_criteria_id !== undefined && career_criteria_id !== null) {
    const criteria = await prisma.career_criteria.findUnique({
      where: { id: career_criteria_id },
    });
    if (!criteria) throw new Error("Career criteria not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update question
    const question = await tx.questions.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(question_type !== undefined && { question_type }),
        ...(difficulty_level !== undefined && { difficulty_level }),
        ...(category_id !== undefined && { category_id }),
        ...(career_criteria_id !== undefined && { career_criteria_id }),
        ...(points !== undefined && { points }),
        ...(explanation !== undefined && { explanation }),
        ...(tags !== undefined && { tags }),
        ...(metadata !== undefined && { metadata }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    // Update options nếu có truyền vào
    if (options !== undefined) {
      // Xóa options cũ
      await tx.question_options.deleteMany({ where: { question_id: id } });

      // Tạo options mới
      if (options.length > 0) {
        await tx.question_options.createMany({
          data: options.map((opt, idx) => ({
            question_id: id,
            option_text: opt.option_text,
            is_correct: opt.is_correct || false,
            order_index: opt.order_index ?? idx,
          })),
        });
      }
    }

    // Lấy lại question kèm options
    const questionOptions = await tx.question_options.findMany({
      where: { question_id: id },
      orderBy: { order_index: "asc" },
    });

    return { ...question, options: questionOptions };
  });

  return result;
};

const deleteQuestion = async (id) => {
  // const examQuestion = await prisma.exam_questions.findFirst({
  //   where: { question_id: id },
  // });
  // if (examQuestion)
  //   throw new Error("Cannot delete question. It is being used in exams");

  await prisma.$transaction(async (tx) => {
    await tx.question_options.deleteMany({ where: { question_id: id } });
    await tx.questions.delete({ where: { id } });
  });

  return { message: "Question deleted successfully" };
};

const updateQuestionOptions = async (questionId, options) => {
  const question = await prisma.questions.findUnique({
    where: { id: questionId },
  });
  if (!question) throw new Error("Question not found");

  await prisma.$transaction(async (tx) => {
    await tx.question_options.deleteMany({
      where: { question_id: questionId },
    });

    if (options && options.length > 0) {
      await tx.question_options.createMany({
        data: options.map((opt, idx) => ({
          question_id: questionId,
          option_text: opt.option_text,
          is_correct: opt.is_correct || false,
          order_index: opt.order_index ?? idx,
        })),
      });
    }
  });

  return { message: "Question options updated successfully" };
};

module.exports = {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  updateQuestionOptions,
};
