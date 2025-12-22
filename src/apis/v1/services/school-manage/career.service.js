const prisma = require("../../../../configs/prisma");
const { FR, OBJECT_TYPE } = require("../../../../common");
const fileStorageService = require("../file-storage/file-storage.service");

const CURRENT_FR = FR.FR00015 || "FR00015";

/**
 * Lấy danh sách đơn hàng đã duyệt của trường
 */
const getApprovedOrdersBySchool = async ({
  school_id,
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
}) => {
  try {
    if (!school_id) {
      throw new Error("school_id is required");
    }

    // Kiểm tra school tồn tại
    const school = await prisma.schools.findUnique({
      where: { id: school_id },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Đếm tổng số records
    const total = await prisma.career_orders.count({
      where: {
        school_id,
        status: "APPROVED",
      },
    });

    // Lấy danh sách orders
    const orders = await prisma.career_orders.findMany({
      where: {
        school_id,
        status: "APPROVED",
      },
      skip: paging.skip,
      take: paging.limit,
      orderBy,
    });

    // Lấy danh sách user IDs (creator và reviewer)
    const creatorIds = [...new Set(orders.map((o) => o.create_by))];
    const reviewerIds = [
      ...new Set(orders.filter((o) => o.reviewed_by).map((o) => o.reviewed_by)),
    ];
    const allUserIds = [...new Set([...creatorIds, ...reviewerIds])];

    // Lấy thông tin users
    const users = await prisma.auth_base_user.findMany({
      where: {
        id: { in: allUserIds },
      },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        phone_number: true,
      },
    });

    // Tạo map để tra cứu nhanh
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    // Merge data với chỉ thông tin cần thiết
    const ordersWithDetails = orders.map((order) => {
      const creator = userMap[order.create_by];
      const reviewer = userMap[order.reviewed_by];

      return {
        order_code: order.order_code,
        note: order.note,
        creator: creator
          ? {
              full_name: creator.full_name,
              email: creator.email,
            }
          : null,
        reviewer: reviewer
          ? {
              full_name: reviewer.full_name,
              email: reviewer.email,
            }
          : null,
        created_at: order.created_at,
        reviewed_at: order.reviewed_at,
      };
    });

    return {
      data: ordersWithDetails,
      meta: {
        total,
        skip: paging.skip,
        limit: paging.limit,
      },
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Lấy danh sách nghề đã kích hoạt của trường
 * - Chỉ lấy nghề có is_active = true
 * - Chỉ lấy license có status = ACTIVE
 * - Nếu nhiều license cùng career_id, lấy license có expiry_date muộn nhất
 */
const getActiveCareersForSchool = async ({
  school_id,
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
}) => {
  try {
    if (!school_id) {
      throw new Error("school_id is required");
    }

    // Kiểm tra school tồn tại
    const school = await prisma.schools.findUnique({
      where: { id: school_id },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Lấy tất cả licenses ACTIVE của trường
    const licenses = await prisma.school_career_licenses.findMany({
      where: {
        school_id,
        status: "ACTIVE",
      },
      orderBy: {
        expiry_date: "desc",
      },
    });

    if (licenses.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          skip: paging.skip,
          limit: paging.limit,
        },
      };
    }

    // Lấy career_ids duy nhất và giữ license có expiry_date muộn nhất
    const careerLicenseMap = {};
    licenses.forEach((license) => {
      if (!careerLicenseMap[license.career_id]) {
        careerLicenseMap[license.career_id] = license;
      } else {
        // So sánh expiry_date, giữ license có expiry_date muộn hơn
        const existingExpiry = new Date(
          careerLicenseMap[license.career_id].expiry_date
        );
        const currentExpiry = new Date(license.expiry_date);
        if (currentExpiry > existingExpiry) {
          careerLicenseMap[license.career_id] = license;
        }
      }
    });

    const uniqueCareerIds = Object.keys(careerLicenseMap);

    // Đếm tổng số nghề có is_active = true
    const total = await prisma.career.count({
      where: {
        id: { in: uniqueCareerIds },
        is_active: true,
      },
    });

    // Lấy thông tin chi tiết nghề với phân trang
    const careers = await prisma.career.findMany({
      where: {
        id: { in: uniqueCareerIds },
        is_active: true,
      },
      skip: paging.skip,
      take: paging.limit,
      orderBy,
    });

    // Lấy thông tin criteria đầu tiên của mỗi nghề để lấy ảnh
    const criteriaList = await prisma.career_criteria.findMany({
      where: {
        career_id: { in: careers.map((c) => c.id) },
      },
      orderBy: {
        order_index: "asc",
      },
    });

    // Tạo map để lấy criteria đầu tiên của mỗi nghề
    const criteriaMap = {};
    criteriaList.forEach((criteria) => {
      if (!criteriaMap[criteria.career_id]) {
        criteriaMap[criteria.career_id] = criteria;
      }
    });

    // console.log("careerLicenseMap:", careerLicenseMap);

    // Merge data với thông tin license và ảnh
    const careersWithLicense = await Promise.all(
      careers.map(async (career) => {
        const license = careerLicenseMap[career.id];

        // Lấy ảnh thumbnail từ criteria đầu tiên
        let background_image_url = null;

        const imageMetadata = await fileStorageService.getFirstMetadata(
          OBJECT_TYPE.CAREER_THUMBS,
          career.id
        );
        background_image_url = imageMetadata?.fileUrl || null;

        return {
          id: career.id,
          code: career.code,
          name: career.name,
          description: career.description,
          tags: career.tags,
          is_active: career.is_active,
          created_at: career.created_at,
          updated_at: career.updated_at,
          background_image_url,
          license: {
            id: license.id,
            start_date: license.start_date,
            expiry_date: license.expiry_date,
            status: license.status,
            order_id: license.order_id,
          },
        };
      })
    );

    return {
      data: careersWithLicense,
      meta: {
        total,
        skip: paging.skip,
        limit: paging.limit,
      },
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getApprovedOrdersBySchool,
  getActiveCareersForSchool,
};
