const prisma = require("../../../../configs/prisma");
const { OBJECT_TYPE } = require("../../../../common");
const fileStorageService = require("../../../v1/services/file-storage/file-storage.service");

/**
 * Lấy danh sách nghề cho landing page (public API)
 * @param {Object} params - Parameters
 * @param {Object} params.filters - Filters (search, category_ids)
 * @param {Object} params.paging - Pagination (skip, limit)
 * @returns {Promise<Object>} Danh sách nghề với thông tin tóm gọn
 */
const getAllCareersPublic = async ({ filters = {}, paging = {} }) => {
  try {
    const { skip = 0, limit = 10 } = paging;
    const { search, category_ids } = filters;

    // Build where clause
    const where = {
      is_active: true, // Chỉ lấy career đang active
    };

    // Search by name or code
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    // Filter by category IDs
    let careerIds = null;
    if (category_ids && category_ids.length > 0) {
      const careerCategoryRelations =
        await prisma.career_career_category.findMany({
          where: {
            career_category_id: { in: category_ids },
          },
          select: {
            career_id: true,
          },
        });

      careerIds = [...new Set(careerCategoryRelations.map((r) => r.career_id))];

      if (careerIds.length > 0) {
        where.id = { in: careerIds };
      } else {
        // Không có career nào thuộc categories này
        return {
          data: [],
          meta: {
            total: 0,
            skip,
            limit,
          },
        };
      }
    }

    // Count total
    const total = await prisma.career.count({ where });

    // Get careers
    const careers = await prisma.career.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    // Enrich data with categories, criteria count, and image
    const enrichedCareers = await Promise.all(
      careers.map(async (career) => {
        // Get categories
        const categoryRelations = await prisma.career_career_category.findMany({
          where: { career_id: career.id },
          select: { career_category_id: true },
        });

        const categoryIds = categoryRelations
          .map((r) => r.career_category_id)
          .filter(Boolean);

        let categories = [];
        if (categoryIds.length > 0) {
          categories = await prisma.career_categories.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          });
        }

        // Count criteria
        const criteriaCount = await prisma.career_criteria.count({
          where: {
            career_id: career.id,
            is_active: true,
          },
        });

        // Get image
        const imageMetadata = await fileStorageService.getFirstMetadata(
          OBJECT_TYPE.CAREER_THUMBS,
          career.id
        );

        return {
          id: career.id,
          code: career.code,
          name: career.name,
          categories: categories,
          criteria_count: criteriaCount,
          image_url: imageMetadata?.fileUrl || null,
        };
      })
    );

    return {
      data: enrichedCareers,
      meta: {
        total,
        skip,
        limit,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching careers: ${error.message}`);
  }
};

module.exports = {
  getAllCareersPublic,
};
