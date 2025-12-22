const prisma = require("../../../../configs/prisma");

/**
 * Lấy danh sách career categories với phân trang và tìm kiếm
 */
const getAllCareerCategories = async ({
  filters = {},
  paging = {},
  orderBy = {},
}) => {
  const { skip = 0, limit = 10 } = paging;

  // Đếm tổng số records
  const total = await prisma.career_categories.count({
    where: filters,
  });

  // Lấy dữ liệu với phân trang
  const data = await prisma.career_categories.findMany({
    where: filters,
    skip: skip,
    take: limit,
    orderBy: orderBy,
    select: {
      id: true,
      name: true,
      created_at: true,
      updated_at: true,
    },
  });

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
 * Lấy thông tin career category theo ID
 */
const getCareerCategoryById = async (id) => {
  const careerCategory = await prisma.career_categories.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!careerCategory) {
    throw new Error("Career category not found");
  }

  return careerCategory;
};

/**
 * Tạo mới career category
 */
const createCareerCategory = async (careerCategoryData) => {
  const { name } = careerCategoryData;

  // Kiểm tra tên career category đã tồn tại chưa
  if (name) {
    const existingCareerCategory = await prisma.career_categories.findFirst({
      where: { name },
    });

    if (existingCareerCategory) {
      throw new Error("Career category name already exists");
    }
  }

  const careerCategory = await prisma.career_categories.create({
    data: {
      name,
    },
    select: {
      id: true,
      name: true,
      created_at: true,
      updated_at: true,
    },
  });

  return careerCategory;
};

/**
 * Cập nhật career category
 */
const updateCareerCategory = async (id, careerCategoryData) => {
  const { name } = careerCategoryData;

  // Kiểm tra career category có tồn tại không
  const existingCareerCategory = await prisma.career_categories.findUnique({
    where: { id },
  });

  if (!existingCareerCategory) {
    throw new Error("Career category not found");
  }

  // Kiểm tra tên career category đã tồn tại chưa (ngoại trừ chính nó)
  if (name && name !== existingCareerCategory.name) {
    const duplicateName = await prisma.career_categories.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicateName) {
      throw new Error("Career category name already exists");
    }
  }

  const careerCategory = await prisma.career_categories.update({
    where: { id },
    data: {
      name,
    },
    select: {
      id: true,
      name: true,
      created_at: true,
      updated_at: true,
    },
  });

  return careerCategory;
};

/**
 * Xóa career category
 */
const deleteCareerCategory = async (id) => {
  // Kiểm tra career category có tồn tại không
  const existingCareerCategory = await prisma.career_categories.findUnique({
    where: { id },
  });

  if (!existingCareerCategory) {
    throw new Error("Career category not found");
  }

  await prisma.career_categories.delete({
    where: { id },
  });

  return {
    message: "Delete career category successfully",
  };
};

module.exports = {
  getAllCareerCategories,
  getCareerCategoryById,
  createCareerCategory,
  updateCareerCategory,
  deleteCareerCategory,
};
