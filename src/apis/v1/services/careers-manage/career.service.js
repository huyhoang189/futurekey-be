const prisma = require("../../../../configs/prisma");
const { FR, OBJECT_TYPE, MINIO_BUCKETS } = require("../../../../common");
const { buildWhereClause } = require("../../../../utils/func");
const fileStorageService = require("../file-storage/file-storage.service");
const careerCriteriaService = require("./career-criteria.service");
const careerCategoryRelationService = require("./career-category-relation.service");
const CURRENT_FR = FR.FR00011;

/**
 * Lấy danh sách nghề nghiệp với phân trang và lọc
 */
const getAllCareers = async ({
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
  select = null,
}) => {
  try {
    const where = buildWhereClause(filters);

    const [records, total] = await Promise.all([
      prisma.career.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(select && { select }),
      }),
      prisma.career.count({ where }),
    ]);

    // Optimize: Lấy tất cả created_by_admin unique
    const userIds = [
      ...new Set(records.map((r) => r.created_by_admin).filter(Boolean)),
    ];

    const users = await prisma.auth_base_user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, full_name: true, email: true },
    });

    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Lấy URL ảnh cho tất cả careers
    const recordsWithUserAndImage = await Promise.all(
      records.map(async (career) => {
        // Lấy metadata ảnh đầu tiên
        const imageMetadata = await fileStorageService.getFirstMetadata(
          OBJECT_TYPE.CAREER_THUMBS,
          career.id
        );

        const careerCategories =
          await careerCategoryRelationService.getCareerCategories(career.id);

        return {
          ...career,
          created_by_admin_info: userMap[career.created_by_admin] || null,
          background_image_url: imageMetadata?.fileUrl || null,
          careerCategories: careerCategories || [],
        };
      })
    );

    return {
      data: recordsWithUserAndImage,
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
 * Lấy nghề nghiệp theo ID
 */
const getCareerById = async (id, select = null) => {
  try {
    const career = await prisma.career.findUnique({
      where: { id },
      ...(select && { select }),
    });

    if (!career) {
      throw new Error("Career not found");
    }

    // Lấy metadata ảnh đầu tiên
    const imageMetadata = await fileStorageService.getFirstMetadata(
      OBJECT_TYPE.CAREER_THUMBS,
      career.id
    );

    const careerCategories =
      await careerCategoryRelationService.getCareerCategories(career.id);

    return {
      ...career,
      background_image_url: imageMetadata?.fileUrl || null,
      careerCategories: careerCategories || [],
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới nghề nghiệp
 */
const createCareer = async (data, imageFile = null) => {
  try {
    const {
      code,
      name,
      description,
      created_by_admin,
      tags,
      is_active = false,
      career_category_ids,
    } = data;

    // Kiểm tra mã nghề đã tồn tại
    if (code) {
      const existingCode = await prisma.career.findFirst({
        where: { code },
      });
      if (existingCode) {
        throw new Error("Career code already exists");
      }
    }

    // Kiểm tra tên nghề đã tồn tại
    if (name) {
      const existingCareer = await prisma.career.findFirst({
        where: { name },
      });
      if (existingCareer) {
        throw new Error("Career name already exists");
      }
    }

    // Tạo career trước
    const career = await prisma.career.create({
      data: {
        code,
        name,
        description,
        created_by_admin,
        tags,
        is_active,
      },
    });

    // Upload ảnh nếu có
    let imageUrl = null;
    if (imageFile) {
      try {
        const uploadResult = await fileStorageService.uploadFile({
          fileBuffer: imageFile.buffer,
          fileName: imageFile.originalname,
          mimeType: imageFile.mimetype,
          fileSize: imageFile.size,
          objectType: OBJECT_TYPE.CAREER_THUMBS,
          objectId: career.id,
          bucketName: MINIO_BUCKETS.MEDIA_THUMBS,
          uploadBy: created_by_admin,
        });
        imageUrl = uploadResult.fileUrl;
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError.message);
        // Không throw error, vẫn trả về career
      }
    }

    if (career_category_ids?.length > 0) {
      await careerCategoryRelationService.updateCareerCategories({
        careerId: career.id,
        categoryIds: career_category_ids,
      });
    }

    return {
      ...career,
      background_image_url: imageUrl,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật nghề nghiệp
 */
const updateCareer = async (id, data, imageFile = null) => {
  try {
    // Kiểm tra career tồn tại
    const existingCareer = await prisma.career.findUnique({
      where: { id },
    });

    if (!existingCareer) {
      throw new Error("Career not found");
    }

    const {
      code,
      name,
      description,
      created_by_admin,
      tags,
      is_active,
      career_category_ids,
    } = data;

    // Kiểm tra mã nghề trùng (nếu thay đổi mã)
    if (code && code !== existingCareer.code) {
      const codeExists = await prisma.career.findFirst({
        where: {
          code,
          id: { not: id },
        },
      });
      if (codeExists) {
        throw new Error("Career code already exists");
      }
    }

    // Kiểm tra tên nghề trùng (nếu thay đổi tên)
    if (name && name !== existingCareer.name) {
      const nameExists = await prisma.career.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new Error("Career name already exists");
      }
    }

    // Cập nhật career
    const career = await prisma.career.update({
      where: { id },
      data: {
        code,
        name,
        description,
        created_by_admin,
        tags,
        is_active,
        updated_at: new Date(),
      },
    });

    // Xử lý cập nhật ảnh nếu có
    let imageUrl = null;
    if (imageFile) {
      try {
        // Xóa ảnh cũ và upload ảnh mới
        const uploadResult = await fileStorageService.updateFile(
          OBJECT_TYPE.CAREER_THUMBS,
          career.id,
          {
            fileBuffer: imageFile.buffer,
            fileName: imageFile.originalname,
            mimeType: imageFile.mimetype,
            fileSize: imageFile.size,
            bucketName: MINIO_BUCKETS.MEDIA_THUMBS,
            uploadBy: created_by_admin,
          }
        );
        imageUrl = uploadResult.fileUrl;
      } catch (uploadError) {
        console.error("Error updating image:", uploadError.message);
      }
    } else {
      // Nếu không có ảnh mới, lấy ảnh cũ
      const imageMetadata = await fileStorageService.getFirstMetadata(
        OBJECT_TYPE.CAREER_THUMBS,
        career.id
      );
      imageUrl = imageMetadata?.fileUrl || null;
    }

    if (career_category_ids?.length > 0) {
      await careerCategoryRelationService.updateCareerCategories({
        careerId: career.id,
        categoryIds: career_category_ids,
      });
    }

    return {
      ...career,
      background_image_url: imageUrl,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa vĩnh viễn nghề nghiệp và tất cả tiêu chí liên quan
 */
const deleteCareer = async (id) => {
  try {
    // Kiểm tra career tồn tại
    const existingCareer = await prisma.career.findUnique({
      where: { id },
    });

    if (!existingCareer) {
      throw new Error("Career not found");
    }

    // 1. Lấy tất cả criteria thuộc career này
    const criteriaList = await prisma.career_criteria.findMany({
      where: { career_id: id },
      select: { id: true },
    });

    // 2. Xóa từng criteria và files liên quan bằng service
    const deleteResults = await Promise.allSettled(
      criteriaList.map((criteria) =>
        careerCriteriaService.deleteCareerCriteria(criteria.id)
      )
    );

    // Log các lỗi nếu có
    const failedDeletes = deleteResults.filter((r) => r.status === "rejected");
    if (failedDeletes.length > 0) {
      console.warn(
        `Warning: ${failedDeletes.length} criteria failed to delete:`,
        failedDeletes.map((r) => r.reason?.message)
      );
    }

    // 3. Xóa career từ database
    await prisma.career.delete({
      where: { id },
    });

    // 4. Xóa files của career (ảnh nền)
    try {
      await fileStorageService.deleteFilesByObject(
        OBJECT_TYPE.CAREER_THUMBS,
        id
      );
    } catch (fileError) {
      console.error("Error deleting career files:", fileError.message);
    }

    return {
      success: true,
      message: "Career and all related data deleted permanently",
      deletedCriteriaCount: criteriaList.length,
      successfulDeletes: deleteResults.filter((r) => r.status === "fulfilled")
        .length,
      failedDeletes: failedDeletes.length,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
};
