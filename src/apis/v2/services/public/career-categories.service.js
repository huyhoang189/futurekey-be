const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy tất cả danh sách nhóm nghề (public API - không phân trang)
 * @returns {Promise<Array>} Danh sách nhóm nghề với id và name
 */
const getAllCareerCategoriesPublic = async () => {
  try {
    const categories = await prisma.career_categories.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return categories;
  } catch (error) {
    throw new Error(`Error fetching career categories: ${error.message}`);
  }
};

module.exports = {
  getAllCareerCategoriesPublic,
};
