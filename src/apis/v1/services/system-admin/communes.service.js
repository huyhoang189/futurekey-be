const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy danh sách communes với phân trang và tìm kiếm
 */
const getAllCommunes = async ({ filters = {}, paging = {}, orderBy = {} }) => {
  const { skip = 0, limit = 10 } = paging;

  // Đếm tổng số records
  const total = await prisma.commune.count({
    where: filters,
  });

  // Lấy dữ liệu với phân trang
  const data = await prisma.commune.findMany({
    where: filters,
    skip: skip,
    take: limit,
    orderBy: orderBy,
    select: {
      id: true,
      name: true,
      province_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Manual join với provinces để lấy thông tin tỉnh
  if (data.length > 0) {
    // Lấy unique province_ids
    const provinceIds = [...new Set(data.map(commune => commune.province_id).filter(Boolean))];
    
    if (provinceIds.length > 0) {
      // Query provinces một lần
      const provinces = await prisma.province.findMany({
        where: {
          id: { in: provinceIds },
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Tạo map để lookup nhanh
      const provincesMap = Object.fromEntries(
        provinces.map(province => [province.id, province])
      );

      // Gắn thông tin province vào từng commune
      data.forEach(commune => {
        commune.province = commune.province_id ? provincesMap[commune.province_id] || null : null;
      });
    }
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
 * Lấy thông tin commune theo ID
 */
const getCommuneById = async (id) => {
  const commune = await prisma.commune.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      province_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!commune) {
    throw new Error("Commune not found");
  }

  // Manual join với province
  if (commune.province_id) {
    const province = await prisma.province.findUnique({
      where: { id: commune.province_id },
      select: {
        id: true,
        name: true,
      },
    });
    commune.province = province;
  }

  return commune;
};

/**
 * Tạo mới commune
 */
const createCommune = async (communeData) => {
  const { name, province_id } = communeData;

  // Kiểm tra province có tồn tại không (nếu có province_id)
  if (province_id) {
    const existingProvince = await prisma.province.findUnique({
      where: { id: province_id },
    });

    if (!existingProvince) {
      throw new Error("Province not found");
    }
  }

  // Kiểm tra tên commune đã tồn tại chưa
  if (name) {
    const existingCommune = await prisma.commune.findFirst({
      where: { name },
    });

    if (existingCommune) {
      throw new Error("Commune name already exists");
    }
  }

  const commune = await prisma.commune.create({
    data: {
      name,
      province_id,
    },
    select: {
      id: true,
      name: true,
      province_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Manual join với province
  if (commune.province_id) {
    const province = await prisma.province.findUnique({
      where: { id: commune.province_id },
      select: {
        id: true,
        name: true,
      },
    });
    commune.province = province;
  }

  return commune;
};

/**
 * Cập nhật commune
 */
const updateCommune = async (id, communeData) => {
  const { name, province_id } = communeData;

  // Kiểm tra commune có tồn tại không
  const existingCommune = await prisma.commune.findUnique({
    where: { id },
  });

  if (!existingCommune) {
    throw new Error("Commune not found");
  }

  // Kiểm tra province có tồn tại không (nếu có province_id)
  if (province_id) {
    const existingProvince = await prisma.province.findUnique({
      where: { id: province_id },
    });

    if (!existingProvince) {
      throw new Error("Province not found");
    }
  }

  // Kiểm tra tên commune đã tồn tại chưa (ngoại trừ chính nó)
  if (name && name !== existingCommune.name) {
    const duplicateName = await prisma.commune.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicateName) {
      throw new Error("Commune name already exists");
    }
  }

  const commune = await prisma.commune.update({
    where: { id },
    data: {
      name,
      province_id,
    },
    select: {
      id: true,
      name: true,
      province_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Manual join với province
  if (commune.province_id) {
    const province = await prisma.province.findUnique({
      where: { id: commune.province_id },
      select: {
        id: true,
        name: true,
      },
    });
    commune.province = province;
  }

  return commune;
};

/**
 * Xóa commune
 */
const deleteCommune = async (id) => {
  // Kiểm tra commune có tồn tại không
  const existingCommune = await prisma.commune.findUnique({
    where: { id },
  });

  if (!existingCommune) {
    throw new Error("Commune not found");
  }

  await prisma.commune.delete({
    where: { id },
  });

  return {
    message: "Delete commune successfully",
  };
};

module.exports = {
  getAllCommunes,
  getCommuneById,
  createCommune,
  updateCommune,
  deleteCommune,
};