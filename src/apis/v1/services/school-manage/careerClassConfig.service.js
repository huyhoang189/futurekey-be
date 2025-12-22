const prisma = require("../../../../configs/prisma");
const { FR } = require("../../../../common");

const CURRENT_FR = FR.FR00016 || "FR00016";

/**
 * Lấy danh sách criteria_id theo class_id và career_id
 * @param {Object} params
 * @param {string} params.class_id - ID của lớp (bắt buộc)
 * @param {string} params.career_id - ID của nghề (bắt buộc)
 * @returns {Promise<Array<string>>} Mảng các criteria_id
 */
const getClassCriteriaConfigList = async ({ class_id, career_id }) => {
  try {
    if (!class_id) {
      throw new Error("class_id is required");
    }

    if (!career_id) {
      throw new Error("career_id is required");
    }

    console.log(
      "\x1b[32m%s\x1b[0m",
      `Fetching class criteria configs for class_id: ${class_id}, career_id: ${career_id}`
    );

    // Lấy danh sách class_criteria_config theo class_id và career_id
    const configs = await prisma.class_criteria_config.findMany({
      where: {
        class_id,
        career_id,
      },
      select: {
        criteria_id: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Trả về mảng các criteria_id
    return configs.map((config) => config.criteria_id);
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới bản ghi class_criteria_config
 * @param {Object} params
 * @param {string} params.class_id - ID của lớp (bắt buộc)
 * @param {string} params.career_id - ID của nghề (bắt buộc)
 * @param {string} params.criteria_id - ID của tiêu chí (bắt buộc)
 * @returns {Promise<Object>} Bản ghi vừa tạo
 */
const createClassCriteriaConfig = async ({
  class_id,
  career_id,
  criteria_id,
}) => {
  try {
    if (!class_id) {
      throw new Error("class_id is required");
    }

    if (!career_id) {
      throw new Error("career_id is required");
    }

    if (!criteria_id) {
      throw new Error("criteria_id is required");
    }

    // Kiểm tra xem bản ghi đã tồn tại chưa
    const existingConfig = await prisma.class_criteria_config.findFirst({
      where: {
        class_id,
        career_id,
        criteria_id,
      },
    });

    if (existingConfig) {
      throw new Error(
        "Class criteria config already exists with these parameters"
      );
    }

    // Tạo mới bản ghi
    const newConfig = await prisma.class_criteria_config.create({
      data: {
        class_id,
        career_id,
        criteria_id,
      },
    });

    return newConfig;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa bản ghi class_criteria_config theo class_id, career_id, criteria_id
 * @param {Object} params
 * @param {string} params.class_id - ID của lớp (bắt buộc)
 * @param {string} params.career_id - ID của nghề (bắt buộc)
 * @param {string} params.criteria_id - ID của tiêu chí (bắt buộc)
 * @returns {Promise<Object>} Thông báo kết quả
 */
const deleteClassCriteriaConfig = async ({
  class_id,
  career_id,
  criteria_id,
}) => {
  try {
    if (!class_id) {
      throw new Error("class_id is required");
    }

    if (!career_id) {
      throw new Error("career_id is required");
    }

    if (!criteria_id) {
      throw new Error("criteria_id is required");
    }

    // Kiểm tra bản ghi có tồn tại không
    const existingConfig = await prisma.class_criteria_config.findFirst({
      where: {
        class_id,
        career_id,
        criteria_id,
      },
    });

    if (!existingConfig) {
      throw new Error("Class criteria config not found");
    }

    // Xóa bản ghi
    await prisma.class_criteria_config.delete({
      where: { id: existingConfig.id },
    });

    return {
      message: "Class criteria config deleted successfully",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getClassCriteriaConfigList,
  createClassCriteriaConfig,
  deleteClassCriteriaConfig,
};
