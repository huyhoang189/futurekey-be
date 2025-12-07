const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class QuestionCategoriesService {
  /**
   * Get all question categories
   */
  async getAllCategories({ page = 1, limit = 10, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.name = { contains: search };
    }

    const [categories, total] = await Promise.all([
      prisma.question_categories.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order_index: "asc" },
      }),
      prisma.question_categories.count({ where }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        skip,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id) {
    const category = await prisma.question_categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error("Question category not found");
    }

    return category;
  }

  /**
   * Create new category
   */
  async createCategory(data, created_by) {
    const { name, description, order_index } = data;

    const category = await prisma.question_categories.create({
      data: {
        name,
        description,
        order_index,
        created_by,
      },
    });

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id, data) {
    const existing = await this.getCategoryById(id);

    const updated = await prisma.question_categories.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.order_index !== undefined && { order_index: data.order_index }),
      },
    });

    return updated;
  }

  /**
   * Delete category
   */
  async deleteCategory(id) {
    await this.getCategoryById(id);

    // Check if category is used in questions
    const questionCount = await prisma.questions.count({
      where: { category_id: id },
    });

    if (questionCount > 0) {
      throw new Error(
        `Cannot delete category with ${questionCount} existing questions. Please reassign or delete questions first.`
      );
    }

    // Check if category is used in exam_config_distributions
    const distributionCount = await prisma.exam_config_distributions.count({
      where: { category_id: id },
    });

    if (distributionCount > 0) {
      throw new Error(
        `Cannot delete category with ${distributionCount} existing exam configurations. Please remove from configs first.`
      );
    }

    await prisma.question_categories.delete({
      where: { id },
    });

    return { message: "Question category deleted successfully" };
  }
}

module.exports = new QuestionCategoriesService();
