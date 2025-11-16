const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { FR, OBJECT_TYPE, MINIO_BUCKETS } = require("../../../../common");
const { buildWhereClause } = require("../../../../utils/func");
const fileStorageService = require("../file-storage/file-storage.service");

const CURRENT_FR = FR.FR00012;

/**
 * Lấy danh sách tiêu chí nghề nghiệp với phân trang và lọc
 */
const getAllCareerCriteria = async ({
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { order_index: "asc" },
  select = null,
  includeCareer = true, // Tham số để quyết định có join career không
}) => {
  try {
    const where = buildWhereClause(filters);

    // Nếu có select custom, đảm bảo có career_id để join
    const selectWithCareerId =
      select && includeCareer ? { ...select, career_id: true } : select;

    const [records, total] = await Promise.all([
      prisma.career_criteria.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(selectWithCareerId && { select: selectWithCareerId }),
      }),
      prisma.career_criteria.count({ where }),
    ]);

    // Chỉ join career nếu includeCareer = true
    if (!includeCareer) {
      return {
        data: records,
        meta: {
          total,
          ...paging,
        },
      };
    }

    // Optimize: Lấy tất cả career_ids unique
    const careerIds = [
      ...new Set(records.map((r) => r.career_id).filter(Boolean)),
    ];

    // Query tất cả careers một lần
    const careers =
      careerIds.length > 0
        ? await prisma.career.findMany({
            where: { id: { in: careerIds } },
            select: {
              id: true,
              name: true,
              description: true,
              tags: true,
              is_active: true,
            },
          })
        : [];

    // Map careers thành object để lookup nhanh
    const careerMap = Object.fromEntries(careers.map((c) => [c.id, c]));

    // Gắn career và files vào từng criteria
    const recordsWithCareerAndFiles = await Promise.all(
      records.map(async (criteria) => {
        // Lấy file URLs
        const videoThumbnail = await fileStorageService.getFirstMetadata(
          OBJECT_TYPE.CRITERIA_VIDEO_THUMBS,
          criteria.id
        );
        const videoMetadata = await fileStorageService.getFirstMetadata(
          OBJECT_TYPE.CRITERIA_VIDEO,
          criteria.id
        );
        const attachments = await fileStorageService.getFilesByObject(
          OBJECT_TYPE.ATTACHMENTS,
          criteria.id
        );

        // Tạo cấu trúc video object
        const videoInfo = videoMetadata
          ? {
              video_thumb_url: videoThumbnail?.fileUrl || null,
              video_url: videoMetadata.fileUrl,
              ...(videoMetadata.metadata || {}), // Spread metadata của video (duration, durationFormatted, etc.)
            }
          : null;

        return {
          ...criteria,
          career: criteria.career_id
            ? careerMap[criteria.career_id] || null
            : null,
          video: videoInfo,
          attachments: attachments || [],
        };
      })
    );

    return {
      data: recordsWithCareerAndFiles,
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
 * Lấy tiêu chí nghề nghiệp theo ID
 */
const getCareerCriteriaById = async (id, select = null) => {
  try {
    const criteria = await prisma.career_criteria.findUnique({
      where: { id },
      ...(select && { select }),
    });

    if (!criteria) {
      throw new Error("Career criteria not found");
    }

    // Lấy thông tin career nếu có
    let career = null;
    if (criteria.career_id) {
      career = await prisma.career.findUnique({
        where: { id: criteria.career_id },
        select: {
          id: true,
          name: true,
          description: true,
          tags: true,
          is_active: true,
        },
      });
    }

    // Lấy file URLs
    const videoThumbnail = await fileStorageService.getFirstMetadata(
      OBJECT_TYPE.CRITERIA_VIDEO_THUMBS,
      criteria.id
    );
    const videoMetadata = await fileStorageService.getFirstMetadata(
      OBJECT_TYPE.CRITERIA_VIDEO,
      criteria.id
    );
    const attachments = await fileStorageService.getFilesByObject(
      OBJECT_TYPE.ATTACHMENTS,
      criteria.id
    );

    // Tạo cấu trúc video object
    const videoInfo = videoMetadata
      ? {
          video_thumb_url: videoThumbnail?.fileUrl || null,
          video_url: videoMetadata.fileUrl,
          ...(videoMetadata || {}), // Spread metadata của video (duration, durationFormatted, etc.)
        }
      : null;

    return {
      ...criteria,
      career,
      video: videoInfo,
      attachments: attachments || [],
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới tiêu chí nghề nghiệp
 */
const createCareerCriteria = async (data, files = null) => {
  try {
    const {
      name,
      description,
      order_index,
      is_active = false,
      career_id,
      created_by_admin,
    } = data;

    // Kiểm tra career tồn tại
    if (career_id) {
      const careerExists = await prisma.career.findUnique({
        where: { id: career_id },
      });
      if (!careerExists) {
        throw new Error("Career not found");
      }
    }

    // Kiểm tra tên tiêu chí đã tồn tại trong cùng career
    if (name && career_id) {
      const existingCriteria = await prisma.career_criteria.findFirst({
        where: {
          name,
          career_id,
        },
      });
      if (existingCriteria) {
        throw new Error("Career criteria name already exists in this career");
      }
    }

    // Tạo criteria trước
    const criteria = await prisma.career_criteria.create({
      data: {
        name,
        description,
        order_index,
        is_active,
        career_id,
      },
    });

    // Upload files nếu có
    let videoThumbnailUrl = null;
    let videoUrl = null;
    let attachmentUrls = [];

    if (files) {
      // Upload video thumbnail
      if (files.video_thumbnail && files.video_thumbnail[0]) {
        const thumbFile = files.video_thumbnail[0];
        const result = await fileStorageService.uploadFile({
          fileBuffer: thumbFile.buffer,
          fileName: thumbFile.originalname,
          mimeType: thumbFile.mimetype,
          fileSize: thumbFile.size,
          objectType: OBJECT_TYPE.CRITERIA_VIDEO_THUMBS,
          objectId: criteria.id,
          bucketName: MINIO_BUCKETS.MEDIA_THUMBS,
          uploadBy: created_by_admin,
        });
        videoThumbnailUrl = result.fileUrl;
      }

      // Upload video
      if (files.video && files.video[0]) {
        const videoFile = files.video[0];
        const result = await fileStorageService.uploadFile({
          fileBuffer: videoFile.buffer,
          fileName: videoFile.originalname,
          mimeType: videoFile.mimetype,
          fileSize: videoFile.size,
          objectType: OBJECT_TYPE.CRITERIA_VIDEO,
          objectId: criteria.id,
          bucketName: MINIO_BUCKETS.MEDIA_VIDEOS,
          uploadBy: created_by_admin,
        });
        videoUrl = result.fileUrl;
      }

      // Upload attachments
      if (files.attachments && files.attachments.length > 0) {
        for (const attachmentFile of files.attachments) {
          const result = await fileStorageService.uploadFile({
            fileBuffer: attachmentFile.buffer,
            fileName: attachmentFile.originalname,
            mimeType: attachmentFile.mimetype,
            fileSize: attachmentFile.size,
            objectType: OBJECT_TYPE.ATTACHMENTS,
            objectId: criteria.id,
            bucketName: MINIO_BUCKETS.ATTACHMENTS,
            uploadBy: created_by_admin,
          });
          attachmentUrls.push(result.fileUrl);
        }
      }
    }

    return {
      ...criteria,
      video_thumbnail_url: videoThumbnailUrl,
      video_url: videoUrl,
      attachments: attachmentUrls,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật tiêu chí nghề nghiệp
 */
const updateCareerCriteria = async (id, data, files = null) => {
  try {
    // Kiểm tra criteria tồn tại
    const existingCriteria = await prisma.career_criteria.findUnique({
      where: { id },
    });

    if (!existingCriteria) {
      throw new Error("Career criteria not found");
    }

    const {
      name,
      description,
      order_index,
      is_active,
      career_id,
      created_by_admin,
    } = data;

    // Kiểm tra career tồn tại (nếu thay đổi career_id)
    if (career_id && career_id !== existingCriteria.career_id) {
      const careerExists = await prisma.career.findUnique({
        where: { id: career_id },
      });
      if (!careerExists) {
        throw new Error("Career not found");
      }
    }

    // Kiểm tra tên tiêu chí trùng trong cùng career (nếu thay đổi tên hoặc career)
    const finalCareerId = career_id || existingCriteria.career_id;
    if (
      name &&
      (name !== existingCriteria.name ||
        career_id !== existingCriteria.career_id)
    ) {
      const nameExists = await prisma.career_criteria.findFirst({
        where: {
          name,
          career_id: finalCareerId,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new Error("Career criteria name already exists in this career");
      }
    }

    const criteria = await prisma.career_criteria.update({
      where: { id },
      data: {
        name,
        description,
        order_index,
        is_active,
        career_id,
        updated_at: new Date(),
      },
    });

    // Upload/Update files nếu có
    let videoThumbnailUrl = null;
    let videoUrl = null;
    let attachmentUrls = [];

    if (files) {
      // Update video thumbnail
      if (files.video_thumbnail && files.video_thumbnail[0]) {
        const thumbFile = files.video_thumbnail[0];
        const result = await fileStorageService.updateFile(
          OBJECT_TYPE.CRITERIA_VIDEO_THUMBS,
          criteria.id,
          {
            fileBuffer: thumbFile.buffer,
            fileName: thumbFile.originalname,
            mimeType: thumbFile.mimetype,
            fileSize: thumbFile.size,
            bucketName: MINIO_BUCKETS.MEDIA_THUMBS,
            uploadBy: created_by_admin,
          }
        );
        videoThumbnailUrl = result.fileUrl;
      } else {
        // Giữ nguyên thumbnail cũ
        const oldThumb = await fileStorageService.getFirstMetadata(
          OBJECT_TYPE.CRITERIA_VIDEO_THUMBS,
          criteria.id
        );
        videoThumbnailUrl = oldThumb?.fileUrl || null;
      }

      // Update video
      if (files.video && files.video[0]) {
        const videoFile = files.video[0];
        const result = await fileStorageService.updateFile(
          OBJECT_TYPE.CRITERIA_VIDEO,
          criteria.id,
          {
            fileBuffer: videoFile.buffer,
            fileName: videoFile.originalname,
            mimeType: videoFile.mimetype,
            fileSize: videoFile.size,
            bucketName: MINIO_BUCKETS.MEDIA_VIDEOS,
            uploadBy: created_by_admin,
          }
        );
        videoUrl = result.fileUrl;
      } else {
        // Giữ nguyên video cũ
        const oldVideo = await fileStorageService.getFirstMetadata(
          OBJECT_TYPE.CRITERIA_VIDEO,
          criteria.id
        );
        videoUrl = oldVideo?.fileUrl || null;
      }

      // Update attachments
      if (files.attachments && files.attachments.length > 0) {
        // Xóa attachments cũ
        await fileStorageService.deleteFilesByObject(
          OBJECT_TYPE.ATTACHMENTS,
          criteria.id
        );

        // Upload attachments mới
        for (const attachmentFile of files.attachments) {
          const result = await fileStorageService.uploadFile({
            fileBuffer: attachmentFile.buffer,
            fileName: attachmentFile.originalname,
            mimeType: attachmentFile.mimetype,
            fileSize: attachmentFile.size,
            objectType: OBJECT_TYPE.ATTACHMENTS,
            objectId: criteria.id,
            bucketName: MINIO_BUCKETS.ATTACHMENTS,
            uploadBy: created_by_admin,
          });
          attachmentUrls.push(result.fileUrl);
        }
      } else {
        // Giữ nguyên attachments cũ
        const oldAttachments = await fileStorageService.getFilesByObject(
          OBJECT_TYPE.ATTACHMENTS,
          criteria.id
        );
        attachmentUrls = oldAttachments || [];
      }
    } else {
      // Không có files mới, lấy files cũ
      const videoThumbnail = await fileStorageService.getFirstMetadata(
        OBJECT_TYPE.CRITERIA_VIDEO_THUMBS,
        criteria.id
      );
      const video = await fileStorageService.getFirstMetadata(
        OBJECT_TYPE.CRITERIA_VIDEO,
        criteria.id
      );
      const attachments = await fileStorageService.getFilesByObject(
        OBJECT_TYPE.ATTACHMENTS,
        criteria.id
      );

      videoThumbnailUrl = videoThumbnail?.fileUrl || null;
      videoUrl = video?.fileUrl || null;
      attachmentUrls = attachments || [];
    }

    return {
      ...criteria,
      video_thumbnail_url: videoThumbnailUrl,
      video_url: videoUrl,
      attachments: attachmentUrls,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa vĩnh viễn tiêu chí nghề nghiệp
 */
const deleteCareerCriteria = async (id) => {
  try {
    // Kiểm tra criteria tồn tại
    const existingCriteria = await prisma.career_criteria.findUnique({
      where: { id },
    });

    if (!existingCriteria) {
      throw new Error("Career criteria not found");
    }

    await prisma.career_criteria.delete({
      where: { id },
    });

    // Xóa tất cả files liên quan
    await Promise.all([
      fileStorageService.deleteFilesByObject(
        OBJECT_TYPE.CRITERIA_VIDEO_THUMBS,
        id
      ),
      fileStorageService.deleteFilesByObject(OBJECT_TYPE.CRITERIA_VIDEO, id),
      fileStorageService.deleteFilesByObject(OBJECT_TYPE.ATTACHMENTS, id),
    ]);

    return {
      success: true,
      message: "Career criteria deleted permanently",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllCareerCriteria,
  getCareerCriteriaById,
  createCareerCriteria,
  updateCareerCriteria,
  deleteCareerCriteria,
};
