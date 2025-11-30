const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { FR, OBJECT_TYPE } = require("../../../../common");
const fileStorageService = require("../../../v1/services/file-storage/file-storage.service");
const careerCategoryRelationService = require("../../../v1/services/careers-manage/career-category-relation.service");

const CURRENT_FR = FR.FR00015 || "FR00015";

const getActiveCareersForSchool = async ({
  school_id,
  categoryIds = [],
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

    let candidateCareerIds = Object.keys(careerLicenseMap);

    if (categoryIds && categoryIds.length > 0) {
      const relations = await prisma.career_career_category.findMany({
        where: {
          career_id: { in: candidateCareerIds },
          career_category_id: { in: categoryIds },
        },
        select: { career_id: true },
      });

      const filteredIds = [
        ...new Set(relations.map((rel) => rel.career_id).filter(Boolean)),
      ];

      candidateCareerIds = filteredIds;
    }

    if (candidateCareerIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          skip: paging.skip,
          limit: paging.limit,
        },
      };
    }

    // Đếm tổng số nghề có is_active = true
    const total = await prisma.career.count({
      where: {
        id: { in: candidateCareerIds },
        is_active: true,
      },
    });

    // Lấy thông tin chi tiết nghề với phân trang
    const careers = await prisma.career.findMany({
      where: {
        id: { in: candidateCareerIds },
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

    // Map career -> categories
    const careerCategoryMap = {};
    await Promise.all(
      careers.map(async (career) => {
        careerCategoryMap[career.id] =
          (await careerCategoryRelationService.getCareerCategories(
            career.id
          )) || [];
      })
    );

    const careersWithLicense = await Promise.all(
      careers.map(async (career) => {
        const imageMetadata = await fileStorageService.getFirstMetadata(
          OBJECT_TYPE.CAREER_THUMBS,
          career.id
        );
        const background_image_url = imageMetadata?.fileUrl || null;

        return {
          id: career.id,
          code: career.code,
          name: career.name,
          description: career.description,
          background_image_url,
          careerCategories: careerCategoryMap[career.id] || [],
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
  getActiveCareersForSchool,
};
