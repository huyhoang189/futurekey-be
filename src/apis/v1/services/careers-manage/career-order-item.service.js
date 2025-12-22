const prisma = require("../../../../configs/prisma");
const { FR } = require("../../../../common");
const { buildWhereClause } = require("../../../../utils/func");

const CURRENT_FR = FR.FR00015 || "FR00015";

/**
 * Lấy danh sách items của đơn hàng
 */
const getAllCareerOrderItems = async ({
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
      prisma.career_order_items.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(select && { select }),
      }),
      prisma.career_order_items.count({ where }),
    ]);

    // Lấy danh sách career_id duy nhất
    const careerIds = [...new Set(records.map((item) => item.career_id))];

    // Query thông tin career
    const careers = await prisma.career.findMany({
      where: {
        id: { in: careerIds },
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    // Tạo map để tra cứu nhanh
    const careerMap = careers.reduce((acc, career) => {
      acc[career.id] = career;
      return acc;
    }, {});

    // Merge data
    const recordsWithCareer = records.map((item) => ({
      ...item,
      career: careerMap[item.career_id] || null,
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
 * Lấy item theo ID
 */
const getCareerOrderItemById = async (id, select = null) => {
  try {
    const item = await prisma.career_order_items.findUnique({
      where: { id },
      ...(select && { select }),
    });

    if (!item) {
      throw new Error("Career order item not found");
    }

    // Lấy thông tin career
    const career = await prisma.career.findUnique({
      where: { id: item.career_id },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    return {
      ...item,
      career: career || null,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới item cho đơn hàng
 */
const createCareerOrderItem = async (data) => {
  try {
    const { order_id, career_id, price } = data;

    // Validate
    if (!order_id || !career_id) {
      throw new Error("order_id and career_id are required");
    }

    // Set price = 0 nếu undefined hoặc < 0
    const finalPrice = price === undefined || price < 0 ? 0 : price;

    // Kiểm tra order tồn tại
    const order = await prisma.career_orders.findUnique({
      where: { id: order_id },
    });

    if (!order) {
      throw new Error("Career order not found");
    }

    // Kiểm tra career tồn tại
    const career = await prisma.career.findUnique({
      where: { id: career_id },
    });

    if (!career) {
      throw new Error("Career not found");
    }

    // Kiểm tra item đã tồn tại chưa
    const existingItem = await prisma.career_order_items.findFirst({
      where: {
        order_id,
        career_id,
      },
    });

    if (existingItem) {
      throw new Error("This career already exists in the order");
    }

    // Tạo item
    const item = await prisma.career_order_items.create({
      data: {
        order_id,
        career_id,
        price: finalPrice,
      },
    });

    return item;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật item
 */
const updateCareerOrderItem = async (id, data) => {
  try {
    // Kiểm tra item tồn tại
    const existingItem = await prisma.career_order_items.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new Error("Career order item not found");
    }

    const { career_id, price } = data;

    // Nếu thay đổi career_id, kiểm tra career tồn tại
    if (career_id && career_id !== existingItem.career_id) {
      const career = await prisma.career.findUnique({
        where: { id: career_id },
      });

      if (!career) {
        throw new Error("Career not found");
      }

      // Kiểm tra career mới đã tồn tại trong order chưa
      const duplicateItem = await prisma.career_order_items.findFirst({
        where: {
          order_id: existingItem.order_id,
          career_id,
          id: { not: id },
        },
      });

      if (duplicateItem) {
        throw new Error("This career already exists in the order");
      }
    }

    // Set price = 0 nếu < 0
    const finalPrice =
      price !== undefined ? (price < 0 ? 0 : price) : undefined;

    // Cập nhật item
    const item = await prisma.career_order_items.update({
      where: { id },
      data: {
        career_id,
        ...(finalPrice !== undefined && { price: finalPrice }),
        updated_at: new Date(),
      },
    });

    return item;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa item
 */
const deleteCareerOrderItem = async (id) => {
  try {
    // Kiểm tra item tồn tại
    const existingItem = await prisma.career_order_items.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new Error("Career order item not found");
    }

    // Xóa item
    await prisma.career_order_items.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Career order item deleted successfully",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa tất cả items của một đơn hàng
 */
const deleteAllItemsByOrderId = async (order_id) => {
  try {
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

    // Xóa tất cả items
    const result = await prisma.career_order_items.deleteMany({
      where: { order_id },
    });

    return {
      success: true,
      message: `Deleted ${result.count} items successfully`,
      deletedCount: result.count,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllCareerOrderItems,
  getCareerOrderItemById,
  createCareerOrderItem,
  updateCareerOrderItem,
  deleteCareerOrderItem,
  deleteAllItemsByOrderId,
};
