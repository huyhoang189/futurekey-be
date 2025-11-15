const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { FR } = require("../../../../common");
const { buildWhereClause } = require("../../../../utils/func");

const CURRENT_FR = FR.FR00012;

/**
 * Lấy danh sách tiêu chí nghề nghiệp với phân trang và lọc
 */
const getAllCareerCriteria = async ({
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { order_index: "asc" },
  select = null,
  includeCareer = true, // Tham số để quyết định có join career không
}) => {
  try {
    const where = buildWhereClause(filters);

    // Nếu có select custom, đảm bảo có career_id để join
    const selectWithCareerId =
      select && includeCareer ? { ...select, career_id: true } : select;

    const [records, total] = await Promise.all([
      prisma.career_criteria.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(selectWithCareerId && { select: selectWithCareerId }),
      }),
      prisma.career_criteria.count({ where }),
    ]);

    // Chỉ join career nếu includeCareer = true
    if (!includeCareer) {
      return {
        data: records,
        meta: {
          total,
          ...paging,
        },
      };
    }

    // Optimize: Lấy tất cả career_ids unique
    const careerIds = [
      ...new Set(records.map((r) => r.career_id).filter(Boolean)),
    ];

    // Query tất cả careers một lần
    const careers =
      careerIds.length > 0
        ? await prisma.career.findMany({
            where: { id: { in: careerIds } },
            select: {
              id: true,
              name: true,
              description: true,
              tags: true,
              is_active: true,
            },
          })
        : [];

    // Map careers thành object để lookup nhanh
    const careerMap = Object.fromEntries(careers.map((c) => [c.id, c]));

    // Gắn career vào từng criteria
    const recordsWithCareer = records.map((criteria) => ({
      ...criteria,
      career: criteria.career_id ? careerMap[criteria.career_id] || null : null,
    }));

    return {
      data: recordsWithCareer,
      meta: {
        total,
        ...paging,
      },
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Lấy tiêu chí nghề nghiệp theo ID
 */
const getCareerCriteriaById = async (id, select = null) => {
  try {
    const criteria = await prisma.career_criteria.findUnique({
      where: { id },
      ...(select && { select }),
    });

    if (!criteria) {
      throw new Error("Career criteria not found");
    }

    // Lấy thông tin career nếu có
    if (criteria.career_id) {
      const career = await prisma.career.findUnique({
        where: { id: criteria.career_id },
        select: {
          id: true,
          name: true,
          description: true,
          tags: true,
          is_active: true,
        },
      });
      return { ...criteria, career };
    }

    return { ...criteria, career: null };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới tiêu chí nghề nghiệp
 */
const createCareerCriteria = async (data) => {
  try {
    const {
      name,
      description,
      order_index,
      is_active = false,
      career_id,
    } = data;

    // Kiểm tra career tồn tại
    if (career_id) {
      const careerExists = await prisma.career.findUnique({
        where: { id: career_id },
      });
      if (!careerExists) {
        throw new Error("Career not found");
      }
    }

    // Kiểm tra tên tiêu chí đã tồn tại trong cùng career
    if (name && career_id) {
      const existingCriteria = await prisma.career_criteria.findFirst({
        where: {
          name,
          career_id,
        },
      });
      if (existingCriteria) {
        throw new Error("Career criteria name already exists in this career");
      }
    }

    const criteria = await prisma.career_criteria.create({
      data: {
        name,
        description,
        order_index,
        is_active,
        career_id,
      },
    });

    return criteria;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật tiêu chí nghề nghiệp
 */
const updateCareerCriteria = async (id, data) => {
  try {
    // Kiểm tra criteria tồn tại
    const existingCriteria = await prisma.career_criteria.findUnique({
      where: { id },
    });

    if (!existingCriteria) {
      throw new Error("Career criteria not found");
    }

    const { name, description, order_index, is_active, career_id } = data;

    // Kiểm tra career tồn tại (nếu thay đổi career_id)
    if (career_id && career_id !== existingCriteria.career_id) {
      const careerExists = await prisma.career.findUnique({
        where: { id: career_id },
      });
      if (!careerExists) {
        throw new Error("Career not found");
      }
    }

    // Kiểm tra tên tiêu chí trùng trong cùng career (nếu thay đổi tên hoặc career)
    const finalCareerId = career_id || existingCriteria.career_id;
    if (
      name &&
      (name !== existingCriteria.name ||
        career_id !== existingCriteria.career_id)
    ) {
      const nameExists = await prisma.career_criteria.findFirst({
        where: {
          name,
          career_id: finalCareerId,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new Error("Career criteria name already exists in this career");
      }
    }

    const criteria = await prisma.career_criteria.update({
      where: { id },
      data: {
        name,
        description,
        order_index,
        is_active,
        career_id,
        updated_at: new Date(),
      },
    });

    return criteria;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa vĩnh viễn tiêu chí nghề nghiệp
 */
const deleteCareerCriteria = async (id) => {
  try {
    // Kiểm tra criteria tồn tại
    const existingCriteria = await prisma.career_criteria.findUnique({
      where: { id },
    });

    if (!existingCriteria) {
      throw new Error("Career criteria not found");
    }

    await prisma.career_criteria.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Career criteria deleted permanently",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllCareerCriteria,
  getCareerCriteriaById,
  createCareerCriteria,
  updateCareerCriteria,
  deleteCareerCriteria,
};
