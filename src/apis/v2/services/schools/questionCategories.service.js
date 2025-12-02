const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy danh sách danh mục câu hỏi
 */
const getAllQuestionCategories = async ({ filters = {}, paging = {}, orderBy = {}, search = '' }) => {
  const { skip = 0, limit = 10 } = paging;

  // Search logic
  if (search) {
    if (!filters.OR) {
      filters.OR = [];
    }
    filters.OR.push(
      { name: { contains: search } },
      { description: { contains: search } }
    );
  }

  const total = await prisma.question_categories.count({
    where: filters,
  });

  const data = await prisma.question_categories.findMany({
    where: filters,
    skip,
    take: limit,
    orderBy: orderBy,
  });

  // Join with creator
  if (data.length > 0) {
    const creatorIds = [...new Set(data.map(cat => cat.created_by).filter(Boolean))];

    const creators = creatorIds.length > 0 ? await prisma.auth_base_user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, full_name: true },
    }) : [];

    const creatorsMap = Object.fromEntries(creators.map(c => [c.id, c]));

    data.forEach(category => {
      category.creator = category.created_by ? creatorsMap[category.created_by] || null : null;
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
 * Lấy danh mục câu hỏi theo ID
 */
const getQuestionCategoryById = async (id) => {
  const category = await prisma.question_categories.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error("Question category not found");
  }

  // Join with creator
  const creator = category.created_by ? await prisma.auth_base_user.findUnique({
    where: { id: category.created_by },
    select: { id: true, full_name: true },
  }) : null;

  category.creator = creator;

  return category;
};

/**
 * Tạo danh mục câu hỏi mới
 */
const createQuestionCategory = async (categoryData) => {
  const { name, description, created_by, is_active } = categoryData;

  const category = await prisma.question_categories.create({
    data: {
      name,
      description,
      created_by,
      is_active,
    },
  });

  return category;
};

/**
 * Cập nhật danh mục câu hỏi
 */
const updateQuestionCategory = async (id, updateData) => {
  const { name, description, is_active } = updateData;

  // Check if category exists
  const existing = await prisma.question_categories.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Question category not found");
  }

  const category = await prisma.question_categories.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active }),
    },
  });

  return category;
};

/**
 * Xóa danh mục câu hỏi
 */
const deleteQuestionCategory = async (id) => {
  // Check if category is being used
  const questions = await prisma.questions.findFirst({
    where: { category_id: id },
  });

  if (questions) {
    throw new Error("Cannot delete category. It is being used in questions");
  }

  await prisma.question_categories.delete({
    where: { id },
  });

  return { message: "Question category deleted successfully" };
};

module.exports = {
  getAllQuestionCategories,
  getQuestionCategoryById,
  createQuestionCategory,
  updateQuestionCategory,
  deleteQuestionCategory,
};
