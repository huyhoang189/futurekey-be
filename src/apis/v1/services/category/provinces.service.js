const prisma = require("../../../../configs/prisma");

/**
 * Lấy danh sách provinces với phân trang và tìm kiếm
 */
const getAllProvinces = async ({ filters = {}, paging = {}, orderBy = {} }) => {
  const { skip = 0, limit = 10 } = paging;

  // Đếm tổng số records
  const total = await prisma.province.count({
    where: filters,
  });

  // Lấy dữ liệu với phân trang
  const data = await prisma.province.findMany({
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
 * Lấy thông tin province theo ID
 */
const getProvinceById = async (id) => {
  const province = await prisma.province.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!province) {
    throw new Error("Province not found");
  }

  return province;
};

/**
 * Tạo mới province
 */
const createProvince = async (provinceData) => {
  const { name } = provinceData;

  // Kiểm tra tên province đã tồn tại chưa
  if (name) {
    const existingProvince = await prisma.province.findFirst({
      where: { name },
    });

    if (existingProvince) {
      throw new Error("Province name already exists");
    }
  }

  const province = await prisma.province.create({
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

  return province;
};

/**
 * Cập nhật province
 */
const updateProvince = async (id, provinceData) => {
  const { name } = provinceData;

  // Kiểm tra province có tồn tại không
  const existingProvince = await prisma.province.findUnique({
    where: { id },
  });

  if (!existingProvince) {
    throw new Error("Province not found");
  }

  // Kiểm tra tên province đã tồn tại chưa (ngoại trừ chính nó)
  if (name && name !== existingProvince.name) {
    const duplicateName = await prisma.province.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicateName) {
      throw new Error("Province name already exists");
    }
  }

  const province = await prisma.province.update({
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

  return province;
};

/**
 * Xóa province
 */
const deleteProvince = async (id) => {
  // Kiểm tra province có tồn tại không
  const existingProvince = await prisma.province.findUnique({
    where: { id },
  });

  if (!existingProvince) {
    throw new Error("Province not found");
  }

  await prisma.province.delete({
    where: { id },
  });

  return {
    message: "Delete province successfully",
  };
};

/**
 * Lấy danh sách communes của province
 */
const getProvinceCommunes = async (provinceId, paging = {}) => {
  const { skip = 0, limit = 10 } = paging;

  // Kiểm tra province có tồn tại không
  const province = await prisma.province.findUnique({
    where: { id: provinceId },
  });

  if (!province) {
    throw new Error("Province not found");
  }

  // Đếm tổng số communes
  const total = await prisma.commune.count({
    where: { province_id: provinceId },
  });

  // Lấy danh sách communes
  const data = await prisma.commune.findMany({
    where: { province_id: provinceId },
    skip: skip,
    take: limit,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      province_id: true,
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

module.exports = {
  getAllProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
  getProvinceCommunes,
};
