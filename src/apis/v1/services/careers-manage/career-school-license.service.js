const prisma = require("../../../../configs/prisma");
const { FR } = require("../../../../common");
const { buildWhereClause } = require("../../../../utils/func");

const CURRENT_FR = FR.FR00016 || "FR00016";

/**
 * Lấy danh sách licenses theo order_id
 */
const getLicensesByOrderId = async ({
  order_id,
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
  select = null,
}) => {
  try {
    // Validate order_id là bắt buộc
    if (!order_id) {
      throw new Error("order_id is required");
    }

    // Kiểm tra order tồn tại
    const order = await prisma.career_orders.findUnique({
      where: { id: order_id },
    });

    if (!order) {
      throw new Error("Career order not found");
    }

    // Build where clause với order_id
    const where = {
      order_id,
      ...buildWhereClause(filters),
    };

    const [records, total] = await Promise.all([
      prisma.school_career_licenses.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(select && { select }),
      }),
      prisma.school_career_licenses.count({ where }),
    ]);

    // Lấy danh sách school_id, career_id duy nhất
    const schoolIds = [
      ...new Set(records.map((item) => item.school_id).filter(Boolean)),
    ];
    const careerIds = [
      ...new Set(records.map((item) => item.career_id).filter(Boolean)),
    ];

    // Query thông tin school và career
    const [schools, careers] = await Promise.all([
      prisma.schools.findMany({
        where: { id: { in: schoolIds } },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.career.findMany({
        where: { id: { in: careerIds } },
        select: {
          id: true,
          code: true,
          name: true,
          is_active: true,
        },
      }),
    ]);

    // Tạo map để tra cứu nhanh
    const schoolMap = schools.reduce((acc, school) => {
      acc[school.id] = school;
      return acc;
    }, {});

    const careerMap = careers.reduce((acc, career) => {
      acc[career.id] = career;
      return acc;
    }, {});

    // Merge data
    const recordsWithDetails = records.map((item) => ({
      ...item,
      school: schoolMap[item.school_id] || null,
      career: careerMap[item.career_id] || null,
    }));

    return {
      data: recordsWithDetails,
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
 * Thêm mới licenses từ order_id
 */
const createLicense = async ({ order_id, month_rental }) => {
  try {
    // Validate
    if (!order_id || !month_rental) {
      throw new Error("order_id and month_rental are required");
    }

    if (month_rental <= 0) {
      throw new Error("month_rental must be greater than 0");
    }

    // Kiểm tra order tồn tại
    const order = await prisma.career_orders.findUnique({
      where: { id: order_id },
    });

    if (!order) {
      throw new Error("Career order not found");
    }

    // Kiểm tra school tồn tại
    const school = await prisma.schools.findUnique({
      where: { id: order.school_id },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // 1. Lấy danh sách order items theo order_id
    const orderItems = await prisma.career_order_items.findMany({
      where: { order_id },
    });

    if (orderItems.length === 0) {
      throw new Error("No items found in this order");
    }

    // 2. Tính toán start_date và expiry_date dựa trên month_rental
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + month_rental);

    // 3. Kiểm tra các career trong order items có tồn tại không
    const careerIds = orderItems.map((item) => item.career_id);
    const careers = await prisma.career.findMany({
      where: { id: { in: careerIds } },
    });

    if (careers.length !== careerIds.length) {
      throw new Error("Some careers not found");
    }

    // 4. Kiểm tra licenses đã tồn tại chưa (tránh duplicate)
    const existingLicenses = await prisma.school_career_licenses.findMany({
      where: {
        school_id: school.id,
        order_id,
      },
    });

    if (existingLicenses.length > 0) {
      throw new Error("Licenses for this order already exist");
    }

    // 5. Tạo licenses trong transaction
    const licenses = await prisma.$transaction(
      orderItems.map((item) =>
        prisma.school_career_licenses.create({
          data: {
            school_id: school.id,
            career_id: item.career_id,
            order_id,
            order_item_id: item.id,
            start_date: startDate,
            expiry_date: expiryDate,
          },
        })
      )
    );

    return {
      success: true,
      message: `Created ${licenses.length} licenses successfully`,
      data: licenses,
      meta: {
        total: licenses.length,
        month_rental,
        start_date: startDate,
        expiry_date: expiryDate,
      },
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Thu hồi license theo ID
 */
const revokeLicense = async (id) => {
  try {
    // Kiểm tra license tồn tại
    const existingLicense = await prisma.school_career_licenses.findUnique({
      where: { id },
    });

    if (!existingLicense) {
      throw new Error("License not found");
    }

    // Kiểm tra trạng thái hiện tại
    if (existingLicense.status === "REVOKED") {
      throw new Error("License is already revoked");
    }

    // Cập nhật status thành REVOKED
    const license = await prisma.school_career_licenses.update({
      where: { id },
      data: {
        status: "REVOKED",
        updated_at: new Date(),
      },
    });

    return license;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Gia hạn license theo ID
 */
const renewLicense = async (id, data) => {
  try {
    const { expiry_date } = data;

    // Validate
    if (!expiry_date) {
      throw new Error("expiry_date is required");
    }

    // Kiểm tra license tồn tại
    const existingLicense = await prisma.school_career_licenses.findUnique({
      where: { id },
    });

    if (!existingLicense) {
      throw new Error("License not found");
    }

    // Kiểm tra trạng thái
    if (existingLicense.status === "REVOKED") {
      throw new Error("Cannot renew a revoked license");
    }

    // Validate expiry_date phải sau start_date
    const newExpiryDate = new Date(expiry_date);
    if (
      existingLicense.start_date &&
      newExpiryDate <= existingLicense.start_date
    ) {
      throw new Error("expiry_date must be after start_date");
    }

    // Cập nhật expiry_date và status nếu cần
    const updateData = {
      expiry_date: newExpiryDate,
      updated_at: new Date(),
    };

    // Nếu license đang EXPIRED, chuyển về ACTIVE
    if (existingLicense.status === "EXPIRED") {
      const currentDate = new Date();
      if (newExpiryDate > currentDate) {
        updateData.status = "ACTIVE";
      }
    }

    const license = await prisma.school_career_licenses.update({
      where: { id },
      data: updateData,
    });

    return license;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Kích hoạt license theo ID
 */
const activateLicense = async (id) => {
  try {
    // Kiểm tra license tồn tại
    const existingLicense = await prisma.school_career_licenses.findUnique({
      where: { id },
    });

    if (!existingLicense) {
      throw new Error("License not found");
    }

    // Kiểm tra trạng thái
    if (existingLicense.status === "REVOKED") {
      throw new Error("Cannot activate a revoked license");
    }

    if (existingLicense.status === "ACTIVE") {
      throw new Error("License is already active");
    }

    // Kiểm tra license phải có start_date và expiry_date
    if (!existingLicense.start_date || !existingLicense.expiry_date) {
      throw new Error("License must have start_date and expiry_date");
    }

    // Kiểm tra thời gian hiện tại có nằm trong khoảng [start_date, expiry_date]
    const currentDate = new Date();
    const startDate = new Date(existingLicense.start_date);
    const expiryDate = new Date(existingLicense.expiry_date);

    if (currentDate < startDate) {
      throw new Error("Cannot activate license before start_date");
    }

    if (currentDate > expiryDate) {
      throw new Error("Cannot activate license after expiry_date");
    }

    // Cập nhật license
    const license = await prisma.school_career_licenses.update({
      where: { id },
      data: {
        status: "ACTIVE",
        updated_at: new Date(),
      },
    });

    return license;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getLicensesByOrderId,
  revokeLicense,
  renewLicense,
  activateLicense,
  createLicense,
};
