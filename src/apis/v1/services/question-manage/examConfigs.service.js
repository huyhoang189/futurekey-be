const prisma = require("../../../../configs/prisma");

class ExamConfigsService {
  /**
   * Get all exam configs with pagination and filters
   */
  async getAllExamConfigs({ page = 1, limit = 10, search, exam_type_scope }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.config_name = { contains: search };
    }

    if (exam_type_scope) {
      where.exam_type_scope = exam_type_scope;
    }

    const [configs, total] = await Promise.all([
      prisma.exam_configs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.exam_configs.count({ where }),
    ]);

    // Load distributions for each config
    const configsWithDistributions = await Promise.all(
      configs.map(async (config) => {
        const distributions = await prisma.exam_config_distributions.findMany({
          where: { config_id: config.id },
          orderBy: { order_index: "asc" },
          include: {
            question_categories: {
              select: {
                name: true,
              },
            },
          },
        });
        return { ...config, distributions };
      })
    );

    return {
      data: configsWithDistributions,
      meta: {
        total,
        skip,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get exam config by ID
   */
  async getExamConfigById(id) {
    const config = await prisma.exam_configs.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error("Exam config not found");
    }

    // Load distributions
    const distributions = await prisma.exam_config_distributions.findMany({
      where: { config_id: id },
      orderBy: { order_index: "asc" },
      include: {
        question_categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { ...config, distributions };
  }

  /**
   * Create new exam config with distributions
   */
  async createExamConfig(data, created_by) {
    const {
      config_name,
      description,
      exam_type_scope = "COMPREHENSIVE",
      career_criteria_id,
      time_limit_minutes,
      total_points,
      pass_score,
      distributions = [],
    } = data;

    // Validation: Chỉ cho phép 1 bản ghi COMPREHENSIVE
    if (exam_type_scope === "COMPREHENSIVE") {
      const existingComprehensive = await prisma.exam_configs.findFirst({
        where: { exam_type_scope: "COMPREHENSIVE" },
      });

      if (existingComprehensive) {
        throw new Error(
          "Only one COMPREHENSIVE exam config is allowed"
        );
      }
    }

    // Validation: CRITERIA_SPECIFIC phải có career_criteria_id
    if (exam_type_scope === "CRITERIA_SPECIFIC" && !career_criteria_id) {
      throw new Error(
        "career_criteria_id is required for CRITERIA_SPECIFIC exam type"
      );
    }

    // Validation: COMPREHENSIVE không được có career_criteria_id
    if (exam_type_scope === "COMPREHENSIVE" && career_criteria_id) {
      throw new Error(
        "career_criteria_id should not be provided for COMPREHENSIVE exam type"
      );
    }

    // Validation: Kiểm tra career_criteria_id tồn tại
    if (career_criteria_id) {
      const criteria = await prisma.career_criteria.findUnique({
        where: { id: career_criteria_id },
      });
      if (!criteria) {
        throw new Error("Career criteria not found");
      }
    }

    // Validation: distributions phải có ít nhất 1 item
    if (!distributions || distributions.length === 0) {
      throw new Error("At least one distribution is required");
    }

    // Validation: mỗi distribution phải khớp quantity
    for (const dist of distributions) {
      const {
        quantity,
        easy_count = 0,
        medium_count = 0,
        hard_count = 0,
      } = dist;
      const totalCount = easy_count + medium_count + hard_count;
      if (totalCount !== quantity) {
        throw new Error(
          `Distribution for category ${dist.category_id}: total count (${totalCount}) must equal quantity (${quantity})`
        );
      }
    }

    // Create config + distributions in transaction
    const result = await prisma.$transaction(async (tx) => {
      const config = await tx.exam_configs.create({
        data: {
          config_name,
          description,
          exam_type_scope,
          career_criteria_id,
          time_limit_minutes,
          total_points,
          pass_score,
          created_by,
        },
      });

      // Create distributions
      const distributionRecords = distributions.map((dist, index) => ({
        config_id: config.id,
        category_id: dist.category_id,
        quantity: dist.quantity,
        easy_count: dist.easy_count || 0,
        medium_count: dist.medium_count || 0,
        hard_count: dist.hard_count || 0,
        order_index:
          dist.order_index !== undefined ? dist.order_index : index + 1,
      }));

      await tx.exam_config_distributions.createMany({
        data: distributionRecords,
      });

      // Load created distributions
      const createdDistributions = await tx.exam_config_distributions.findMany({
        where: { config_id: config.id },
        orderBy: { order_index: "asc" },
        include: {
          question_categories: {
            select: {
              name: true,
            },
          },
        },
      });

      return { ...config, distributions: createdDistributions };
    });

    return result;
  }

  /**
   * Update exam config
   */
  async updateExamConfig(id, data) {
    const existingConfig = await prisma.exam_configs.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new Error("Exam config not found");
    }

    const {
      distributions,
      exam_type_scope,
      career_criteria_id,
      ...configData
    } = data;

    // Validation: Nếu update sang COMPREHENSIVE
    if (exam_type_scope === "COMPREHENSIVE") {
      // Kiểm tra xem đã có bản ghi COMPREHENSIVE nào khác chưa (ngoại trừ bản ghi hiện tại)
      const existingComprehensive = await prisma.exam_configs.findFirst({
        where: {
          exam_type_scope: "COMPREHENSIVE",
          id: { not: id },
        },
      });

      if (existingComprehensive) {
        throw new Error(
          "Only one COMPREHENSIVE exam config is allowed"
        );
      }

      // COMPREHENSIVE không được có career_criteria_id
      if (career_criteria_id) {
        throw new Error(
          "career_criteria_id should not be provided for COMPREHENSIVE exam type"
        );
      }
    }

    // Validation: CRITERIA_SPECIFIC phải có career_criteria_id
    if (
      exam_type_scope === "CRITERIA_SPECIFIC" &&
      career_criteria_id === undefined &&
      !existingConfig.career_criteria_id
    ) {
      throw new Error(
        "career_criteria_id is required for CRITERIA_SPECIFIC exam type"
      );
    }

    // Validation: Kiểm tra career_criteria_id tồn tại
    if (career_criteria_id) {
      const criteria = await prisma.career_criteria.findUnique({
        where: { id: career_criteria_id },
      });
      if (!criteria) {
        throw new Error("Career criteria not found");
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update config fields
      const updateData = { ...configData };
      if (exam_type_scope !== undefined)
        updateData.exam_type_scope = exam_type_scope;
      if (career_criteria_id !== undefined)
        updateData.career_criteria_id = career_criteria_id;

      const updated = await tx.exam_configs.update({
        where: { id },
        data: updateData,
      });

      // Update distributions if provided
      if (distributions && distributions.length > 0) {
        // Delete old distributions
        await tx.exam_config_distributions.deleteMany({
          where: { config_id: id },
        });

        // Validate new distributions
        for (const dist of distributions) {
          const {
            quantity,
            easy_count = 0,
            medium_count = 0,
            hard_count = 0,
          } = dist;
          const totalCount = easy_count + medium_count + hard_count;
          if (totalCount !== quantity) {
            throw new Error(
              `Distribution for category ${dist.category_id}: total count (${totalCount}) must equal quantity (${quantity})`
            );
          }
        }

        // Create new distributions
        const distributionRecords = distributions.map((dist, index) => ({
          config_id: id,
          category_id: dist.category_id,
          quantity: dist.quantity,
          easy_count: dist.easy_count || 0,
          medium_count: dist.medium_count || 0,
          hard_count: dist.hard_count || 0,
          order_index:
            dist.order_index !== undefined ? dist.order_index : index + 1,
        }));

        await tx.exam_config_distributions.createMany({
          data: distributionRecords,
        });
      }

      // Load updated distributions
      const updatedDistributions = await tx.exam_config_distributions.findMany({
        where: { config_id: id },
        orderBy: { order_index: "asc" },
        include: {
          question_categories: {
            select: {
              name: true,
            },
          },
        },
      });

      return { ...updated, distributions: updatedDistributions };
    });

    return result;
  }

  /**
   * Delete exam config
   */
  async deleteExamConfig(id) {
    const config = await prisma.exam_configs.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error("Exam config not found");
    }

    // Check if config is used in any attempts
    const attemptCount = await prisma.student_exam_attempts.count({
      where: { exam_config_id: id },
    });

    if (attemptCount > 0) {
      throw new Error(
        `Cannot delete exam config with ${attemptCount} existing attempts. Consider archiving instead.`
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete distributions first
      await tx.exam_config_distributions.deleteMany({
        where: { config_id: id },
      });

      // Delete config
      await tx.exam_configs.delete({
        where: { id },
      });
    });

    return { message: "Exam config deleted successfully" };
  }
}

module.exports = new ExamConfigsService();
