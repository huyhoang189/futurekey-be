const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { buildWhereClause } = require("../../../../utils/func");
const { hashPassword } = require("../../../../utils/bcrypt");
const { USER_STATUS, FR } = require("../../../../common");

const CURRENT_FR = FR.FR00010;

const getAllSettings = async ({
  filters,
  paging,
  orderBy = { created_at: "desc" },
  select = null,
}) => {
  try {
    const where = buildWhereClause(filters);
    const [records, total] = await Promise.all([
      prisma.system_setting.findMany({
        where,
        skip: paging?.skip || 0,
        take: paging?.limit || 10,
        orderBy,
        select,
      }),
      prisma.system_setting.count({ where }),
    ]);
    return {
      data: records,
      meta: {
        total,
        ...paging,
      },
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR}`, error.message);
  }
};

const updateSetting = async (id, data) => {
  try {
    const { value_setting } = data;

    const setting = await prisma.system_setting.update({
      where: { id },
      data: { value_setting },
    });
    return setting;
  } catch (error) {
    throw new Error(`${CURRENT_FR}`, error.message);
  }
};

const findSettingByKey = async (key) => {
  try {
    const setting = await prisma.system_setting.findUnique({
      where: { name_setting: key },
    });
    return setting?.value_setting || null;
  } catch (error) {
    throw new Error(`${CURRENT_FR}`, error.message);
  }
};

module.exports = {
  getAllSettings,
  updateSetting,
  findSettingByKey,
};
