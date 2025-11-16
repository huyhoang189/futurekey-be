const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { FR } = require("../../../../common");
const { buildWhereClause } = require("../../../../utils/func");

const CURRENT_FR = FR.FR00014 || "FR00014";

/**
 * Lấy danh sách đơn hàng nghề nghiệp với phân trang và lọc
 */
const getAllCareerOrders = async ({
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
  select = null,
}) => {
  try {
    const where = buildWhereClause(filters);

    const [records, total] = await Promise.all([
      prisma.career_orders.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(select && { select }),
      }),
      prisma.career_orders.count({ where }),
    ]);

    // Lấy danh sách school_id, create_by, reviewed_by duy nhất
    const schoolIds = [
      ...new Set(records.map((item) => item.school_id).filter(Boolean)),
    ];
    const createByIds = [
      ...new Set(records.map((item) => item.create_by).filter(Boolean)),
    ];
    const reviewedByIds = [
      ...new Set(records.map((item) => item.reviewed_by).filter(Boolean)),
    ];
    const allUserIds = [...new Set([...createByIds, ...reviewedByIds])];

    // Query thông tin school và user
    const [schools, users] = await Promise.all([
      prisma.schools.findMany({
        where: { id: { in: schoolIds } },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.auth_base_user.findMany({
        where: { id: { in: allUserIds } },
        select: {
          id: true,
          user_name: true,
          full_name: true,
          email: true,
        },
      }),
    ]);

    // Tạo map để tra cứu nhanh
    const schoolMap = schools.reduce((acc, school) => {
      acc[school.id] = school;
      return acc;
    }, {});

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    // Merge data
    const recordsWithDetails = records.map((item) => ({
      ...item,
      school: schoolMap[item.school_id] || null,
      creator: userMap[item.create_by] || null,
      reviewer: userMap[item.reviewed_by] || null,
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
 * Lấy đơn hàng theo ID
 */
const getCareerOrderById = async (id, select = null) => {
  try {
    const order = await prisma.career_orders.findUnique({
      where: { id },
      ...(select && { select }),
    });

    if (!order) {
      throw new Error("Career order not found");
    }

    // Lấy thông tin school và users
    const [school, creator, reviewer] = await Promise.all([
      order.school_id
        ? prisma.schools.findUnique({
            where: { id: order.school_id },
            select: {
              id: true,
              name: true,
              code: true,
            },
          })
        : null,
      order.create_by
        ? prisma.auth_base_user.findUnique({
            where: { id: order.create_by },
            select: {
              id: true,
              user_name: true,
              full_name: true,
              email: true,
            },
          })
        : null,
      order.reviewed_by
        ? prisma.auth_base_user.findUnique({
            where: { id: order.reviewed_by },
            select: {
              id: true,
              user_name: true,
              full_name: true,
              email: true,
            },
          })
        : null,
    ]);

    return {
      ...order,
      school: school || null,
      creator: creator || null,
      reviewer: reviewer || null,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới đơn hàng nghề nghiệp
 */
const createCareerOrder = async (data) => {
  try {
    const { school_id, create_by, note, career_ids } = data;

    // Validate
    if (!school_id || !create_by) {
      throw new Error("school_id and create_by are required");
    }

    if (!career_ids || !Array.isArray(career_ids) || career_ids.length === 0) {
      throw new Error("career_ids is required and must be a non-empty array");
    }

    // Validate school tồn tại
    const school = await prisma.schools.findUnique({
      where: { id: school_id },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Validate user tồn tại
    const user = await prisma.auth_base_user.findUnique({
      where: { id: create_by },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Kiểm tra trùng lặp career_ids
    const uniqueCareerIds = [...new Set(career_ids)];
    if (uniqueCareerIds.length !== career_ids.length) {
      throw new Error("Duplicate career_ids found");
    }

    // Validate tất cả careers tồn tại
    const careers = await prisma.career.findMany({
      where: {
        id: { in: career_ids },
      },
    });

    if (careers.length !== career_ids.length) {
      throw new Error("Some careers not found");
    }

    // Tạo order và items trong transaction
    const result = await prisma.$transaction(async (tx) => {
      // Tạo order (status sẽ mặc định trong DB)
      const order = await tx.career_orders.create({
        data: {
          school_id,
          create_by,
          ...(note && { note }),
        },
      });

      // Tạo order items với price = 0
      const orderItems = await Promise.all(
        career_ids.map((career_id) =>
          tx.career_order_items.create({
            data: {
              order_id: order.id,
              career_id,
              price: 0,
            },
          })
        )
      );

      return {
        ...order,
        items: orderItems,
      };
    });

    return result;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Duyệt hoặc từ chối đơn hàng
 */
const reviewCareerOrder = async (id, data) => {
  try {
    const { status, reviewed_by, note } = data;

    // Validate
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      throw new Error("status must be APPROVED or REJECTED");
    }

    if (!reviewed_by) {
      throw new Error("reviewed_by is required");
    }

    // Kiểm tra order tồn tại
    const existingOrder = await prisma.career_orders.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new Error("Career order not found");
    }

    // Cập nhật order
    const order = await prisma.career_orders.update({
      where: { id },
      data: {
        status,
        reviewed_by,
        reviewed_at: new Date(),
        note: note || existingOrder.note,
        updated_at: new Date(),
      },
    });

    return order;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa đơn hàng
 */
const deleteCareerOrder = async (id) => {
  try {
    // Kiểm tra order tồn tại
    const existingOrder = await prisma.career_orders.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new Error("Career order not found");
    }

    // Xóa order và items trong transaction
    await prisma.$transaction(async (tx) => {
      // Xóa tất cả order items trước
      await tx.career_order_items.deleteMany({
        where: { order_id: id },
      });

      // Xóa order
      await tx.career_orders.delete({
        where: { id },
      });
    });

    return {
      success: true,
      message: "Career order deleted successfully",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllCareerOrders,
  getCareerOrderById,
  createCareerOrder,
  reviewCareerOrder,
  deleteCareerOrder,
};
