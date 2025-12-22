const prisma = require("../../../../configs/prisma");
const { FR } = require("../../../../common");

const CURRENT_FR = FR.FR00011;

/**
 * Lấy danh sách nhóm nghề theo ID của nghề
 * @param {string} careerId - ID của nghề
 * @returns {Promise<Array>} Danh sách nhóm nghề (id, name)
 */
const getCareerCategories = async (careerId) => {
  try {
    // Kiểm tra career có tồn tại không
    const career = await prisma.career.findUnique({
      where: { id: careerId },
    });

    if (!career) {
      throw new Error("Career not found");
    }

    // Lấy danh sách career_career_category
    const careerCategoryRelations =
      await prisma.career_career_category.findMany({
        where: { career_id: careerId },
        select: {
          career_category_id: true,
        },
      });

    // Lấy danh sách category IDs
    const categoryIds = careerCategoryRelations
      .map((rel) => rel.career_category_id)
      .filter(Boolean);

    if (categoryIds.length === 0) {
      return [];
    }

    // Lấy thông tin chi tiết của các categories
    const categories = await prisma.career_categories.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return categories;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật nhóm nghề cho nghề
 * Xóa tất cả các nhóm nghề cũ và thêm mới theo danh sách mới
 * @param {string} careerId - ID của nghề
 * @param {Array<string>} categoryIds - Danh sách ID của nhóm nghề mới
 * @returns {Promise<Object>} Kết quả cập nhật
 */
const updateCareerCategories = async ({ careerId, categoryIds = [] }) => {
  try {
    console.log("categoryIds", categoryIds);
    // Kiểm tra career có tồn tại không
    const career = await prisma.career.findUnique({
      where: { id: careerId },
    });

    if (!career) {
      throw new Error("Career not found");
    }

    // Kiểm tra tất cả category IDs có tồn tại không
    if (categoryIds.length > 0) {
      const existingCategories = await prisma.career_categories.findMany({
        where: {
          id: { in: categoryIds },
        },
        select: { id: true },
      });

      if (existingCategories.length !== categoryIds.length) {
        throw new Error("One or more career categories not found");
      }
    }

    // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    const result = await prisma.$transaction(async (tx) => {
      // 1. Xóa tất cả các bản ghi cũ
      const deletedCount = await tx.career_career_category.deleteMany({
        where: { career_id: careerId },
      });

      // 2. Thêm các bản ghi mới
      let createdCount = 0;
      if (categoryIds.length > 0) {
        const createData = categoryIds.map((categoryId) => ({
          career_id: careerId,
          career_category_id: categoryId,
        }));

        const createResult = await tx.career_career_category.createMany({
          data: createData,
        });

        createdCount = createResult.count;
      }

      return {
        deletedCount: deletedCount.count,
        createdCount,
      };
    });

    return {
      success: true,
      message: "Career categories updated successfully",
      deletedCount: result.deletedCount,
      createdCount: result.createdCount,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getCareerCategories,
  updateCareerCategories,
};
