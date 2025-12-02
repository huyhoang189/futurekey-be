const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fileStorageService = require("../../../v1/services/file-storage/file-storage.service");
const { OBJECT_TYPE } = require("../../../../common");
const careerCriteriaService = require("../../../v1/services/careers-manage/career-criteria.service");
const baseCareerService = require("../../../v1/services/careers-manage/career.service");
const learningService = require("./learning.service");

/**
 * Fetch careers configured for a given class via class_criteria_config.
 */
const getCareersForStudent = async ({
  class_id,
  filters = {},
  paging = {},
}) => {
  const { skip = 0, limit = 10 } = paging;
  const { search, categoryIds = [] } = filters;

  if (!class_id) {
    throw new Error("class_id is required");
  }

  // Get career ids configured for the class
  const configuredCareerRecords = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: { career_id: true },
  });

  const configuredCareerIds = [
    ...new Set(
      configuredCareerRecords.map((record) => record.career_id).filter(Boolean)
    ),
  ];

  if (configuredCareerIds.length === 0) {
    return {
      data: [],
      meta: {
        total: 0,
        skip,
        limit,
      },
    };
  }

  let careerIds = configuredCareerIds;

  // Filter by categories if provided
  if (categoryIds.length > 0) {
    const categoryRelations = await prisma.career_career_category.findMany({
      where: {
        career_id: { in: careerIds },
        career_category_id: { in: categoryIds },
      },
      select: { career_id: true },
    });

    careerIds = [
      ...new Set(
        categoryRelations.map((relation) => relation.career_id).filter(Boolean)
      ),
    ];

    if (careerIds.length === 0) {
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

  const where = {
    is_active: true,
    id: { in: careerIds },
  };

  if (search) {
    where.OR = [{ name: { contains: search } }, { code: { contains: search } }];
  }

  const total = await prisma.career.count({ where });

  const careers = await prisma.career.findMany({
    where,
    skip,
    take: limit,
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
    },
  });

  const enrichedCareers = await Promise.all(
    careers.map(async (career) => {
      const categoryRelations = await prisma.career_career_category.findMany({
        where: { career_id: career.id },
        select: { career_category_id: true },
      });

      const relatedCategoryIds = categoryRelations
        .map((relation) => relation.career_category_id)
        .filter(Boolean);

      const careerCategories =
        relatedCategoryIds.length > 0
          ? await prisma.career_categories.findMany({
              where: { id: { in: relatedCategoryIds } },
              select: { id: true, name: true },
            })
          : [];

      const criteriaCount = await prisma.career_criteria.count({
        where: {
          career_id: career.id,
          is_active: true,
        },
      });

      const imageMetadata = await fileStorageService.getFirstMetadata(
        OBJECT_TYPE.CAREER_THUMBS,
        career.id
      );

      return {
        ...career,
        careerCategories,
        background_image_url: imageMetadata?.fileUrl || null,
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
};

const getConfiguredCriteriaForCareer = async ({
  class_id,
  career_id,
  student_id,
  filters = {},
  paging = {},
}) => {
  const { skip = 0, limit = 10 } = paging;
  const { search } = filters;

  if (!class_id) {
    throw new Error("class_id is required");
  }

  if (!career_id) {
    throw new Error("career_id is required");
  }

  const configs = await prisma.class_criteria_config.findMany({
    where: { class_id, career_id },
    select: { criteria_id: true },
  });

  const configuredIds = [
    ...new Set(configs.map((config) => config.criteria_id).filter(Boolean)),
  ];

  if (configuredIds.length === 0) {
    return {
      data: [],
      meta: {
        total: 0,
        skip,
        limit,
      },
    };
  }

  const filtersForCriteria = {
    career_id: { equals: career_id },
    id: { in: configuredIds },
    is_active: { equals: true },
  };

  if (search) {
    filtersForCriteria.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const result = await careerCriteriaService.getAllCareerCriteria({
    filters: filtersForCriteria,
    paging: { skip, limit },
    orderBy: { order_index: "asc" },
  });

  // Get completed criteria for this student and career
  let completedCriteriaIds = [];
  if (student_id) {
    try {
      const completedRecords =
        await learningService.getCompletedCriteriaForCareer({
          student_id,
          career_id,
        });
      completedCriteriaIds = completedRecords.map(
        (record) => record.criteria_id
      );
    } catch (error) {
      console.error("Error fetching completed criteria:", error.message);
    }
  }

  // Enrich criteria with is_completed flag
  const enrichedData = result.data.map((criteria) => ({
    ...criteria,
    is_completed: completedCriteriaIds.includes(criteria.id),
  }));

  return {
    ...result,
    data: enrichedData,
  };
};

const getConfiguredCareerById = async ({ class_id, career_id }) => {
  if (!class_id) {
    throw new Error("class_id is required");
  }

  if (!career_id) {
    throw new Error("career_id is required");
  }

  const configExists = await prisma.class_criteria_config.findFirst({
    where: { class_id, career_id },
    select: { id: true },
  });

  if (!configExists) {
    throw new Error("Career is not configured for this class");
  }

  return baseCareerService.getCareerById(career_id);
};

module.exports = {
  getCareersForStudent,
  getConfiguredCriteriaForCareer,
  getConfiguredCareerById,
};
