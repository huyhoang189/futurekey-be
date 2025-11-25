const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * API #1: Tổng quan hệ thống
 * Lấy các số liệu thống kê tổng quan
 */
const getSystemStats = async () => {
  try {
    const [
      totalSchools,
      totalStudents,
      totalUsers,
      totalTeachers,
      totalClasses,
      totalCareers,
      totalCriteria,
      totalOrders,
      activeLicenses,
      totalFiles,
      storageSize,
    ] = await Promise.all([
      // Tổng số trường
      prisma.schools.count(),

      // Tổng số học sinh
      prisma.auth_impl_user_student.count(),

      // Tổng số người dùng
      prisma.auth_base_user.count(),

      // Tổng số giáo viên (từ bảng school_user)
      prisma.auth_impl_user_school.count(),

      // Tổng số lớp
      prisma.classes.count(),

      // Tổng số nghề
      prisma.career.count(),

      // Tổng số tiêu chí
      prisma.career_criteria.count(),

      // Tổng số đơn hàng
      prisma.career_orders.count(),

      // Số license đang active
      prisma.school_career_licenses.count({
        where: { status: "ACTIVE" },
      }),

      // Tổng số file
      prisma.metadata.count(),

      // Tổng dung lượng
      prisma.metadata.aggregate({
        _sum: { file_size: true },
      }),
    ]);

    return {
      totalSchools,
      totalStudents,
      totalUsers,
      totalTeachers,
      totalClasses,
      totalCareers,
      totalCriteria,
      totalOrders,
      activeLicenses,
      storage: {
        totalFiles,
        totalSizeBytes: storageSize._sum.file_size || 0,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching system stats: ${error.message}`);
  }
};

/**
 * API #2: Thống kê trạng thái đơn hàng
 * Group by status và đếm số lượng
 */
const getOrdersStatusStats = async () => {
  try {
    const ordersGrouped = await prisma.career_orders.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Transform từ array sang object
    const result = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    ordersGrouped.forEach((item) => {
      if (item.status) {
        result[item.status] = item._count.id;
      }
    });

    return result;
  } catch (error) {
    throw new Error(`Error fetching orders status stats: ${error.message}`);
  }
};

/**
 * API #3: Ngành nghề được mua nhiều nhất
 * Group by career_id và đếm số lượng, sau đó join với career để lấy tên
 */
const getTopPurchasedCareers = async (limit = 10) => {
  try {
    // Group by career_id và đếm
    const careerStats = await prisma.career_order_items.groupBy({
      by: ["career_id"],
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" },
      },
      take: limit,
    });

    // Lấy danh sách career IDs
    const careerIds = careerStats.map((item) => item.career_id);

    // Join với bảng career để lấy tên
    const careers = await prisma.career.findMany({
      where: {
        id: { in: careerIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Tạo map để lookup nhanh
    const careersMap = Object.fromEntries(
      careers.map((career) => [career.id, career])
    );

    // Format kết quả
    const result = careerStats.map((item) => ({
      careerId: item.career_id,
      careerName: careersMap[item.career_id]?.name || "Unknown",
      purchased: item._count.id,
    }));

    return result;
  } catch (error) {
    throw new Error(`Error fetching top purchased careers: ${error.message}`);
  }
};

/**
 * API #4: Thống kê license theo trạng thái
 * Group by status và đếm số lượng
 */
const getLicensesStatusStats = async () => {
  try {
    const licensesGrouped = await prisma.school_career_licenses.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Transform từ array sang object
    const result = {
      ACTIVE: 0,
      EXPIRED: 0,
      PENDING_ACTIVATION: 0,
      REVOKED: 0,
    };

    licensesGrouped.forEach((item) => {
      if (item.status) {
        result[item.status] = item._count.id;
      }
    });

    return result;
  } catch (error) {
    throw new Error(`Error fetching licenses status stats: ${error.message}`);
  }
};

/**
 * API #5: License sắp hết hạn
 * Lấy các license ACTIVE có expiry_date trong khoảng days ngày tới
 */
const getExpiringLicenses = async (days = 15) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    // Lấy licenses sắp hết hạn
    const licenses = await prisma.school_career_licenses.findMany({
      where: {
        status: "ACTIVE",
        expiry_date: {
          gte: today,
          lte: futureDate,
        },
      },
      orderBy: {
        expiry_date: "asc",
      },
      select: {
        id: true,
        school_id: true,
        career_id: true,
        expiry_date: true,
      },
    });

    // Lấy danh sách school IDs và career IDs
    const schoolIds = [...new Set(licenses.map((l) => l.school_id))];
    const careerIds = [...new Set(licenses.map((l) => l.career_id))];

    // Join với schools và careers
    const [schools, careers] = await Promise.all([
      prisma.schools.findMany({
        where: { id: { in: schoolIds } },
        select: { id: true, name: true },
      }),
      prisma.career.findMany({
        where: { id: { in: careerIds } },
        select: { id: true, name: true },
      }),
    ]);

    // Tạo maps để lookup
    const schoolsMap = Object.fromEntries(
      schools.map((school) => [school.id, school])
    );
    const careersMap = Object.fromEntries(
      careers.map((career) => [career.id, career])
    );

    // Format kết quả
    const result = licenses.map((license) => ({
      school: schoolsMap[license.school_id]?.name || "Unknown",
      career: careersMap[license.career_id]?.name || "Unknown",
      expiryDate: license.expiry_date,
    }));

    return result;
  } catch (error) {
    throw new Error(`Error fetching expiring licenses: ${error.message}`);
  }
};

module.exports = {
  getSystemStats,
  getOrdersStatusStats,
  getTopPurchasedCareers,
  getLicensesStatusStats,
  getExpiringLicenses,
};
