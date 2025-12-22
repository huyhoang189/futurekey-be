const prisma = require("../../../../configs/prisma");
const { buildWhereClause } = require("../../../../utils/func");
const { FR } = require("../../../../common");

const CURRENT_FR = FR.FR00004 || "FR00004";

/**
 * Lấy danh sách groups với phân trang và lọc
 */
const getAllGroups = async ({
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
  select = null,
}) => {
  try {
    const where = buildWhereClause(filters);

    const [records, total] = await Promise.all([
      prisma.auth_group.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(select && { select }),
      }),
      prisma.auth_group.count({ where }),
    ]);

    return {
      data: records,
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
 * Lấy group theo id
 */
const getGroupById = async (id, select = null) => {
  try {
    const group = await prisma.auth_group.findUnique({
      where: { id },
      ...(select && { select }),
    });

    if (!group) {
      throw new Error("Group not found");
    }

    return group;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới group
 */
const createGroup = async (data) => {
  try {
    const { name, description, type } = data;

    // Kiểm tra tên group đã tồn tại
    if (name) {
      const existingGroup = await prisma.auth_group.findFirst({
        where: { name },
      });
      if (existingGroup) {
        throw new Error("Group name already exists");
      }
    }

    const group = await prisma.auth_group.create({
      data: {
        name,
        description,
        type,
      },
    });

    return group;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật group
 */
const updateGroup = async (id, data) => {
  try {
    // Kiểm tra group tồn tại
    const existingGroup = await prisma.auth_group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      throw new Error("Group not found");
    }

    const { name, description, type } = data;

    // Kiểm tra tên group trùng (nếu thay đổi tên)
    if (name && name !== existingGroup.name) {
      const nameExists = await prisma.auth_group.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new Error("Group name already exists");
      }
    }

    const group = await prisma.auth_group.update({
      where: { id },
      data: {
        name,
        description,
        type,
        updated_at: new Date(),
      },
    });

    return group;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa vĩnh viễn group
 */
const deleteGroup = async (id) => {
  try {
    // Kiểm tra group tồn tại
    const existingGroup = await prisma.auth_group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      throw new Error("Group not found");
    }

    // Kiểm tra có users đang thuộc group này không
    const usersInGroup = await prisma.auth_base_user.count({
      where: { group_id: id },
    });

    if (usersInGroup > 0) {
      throw new Error(
        `Cannot delete group. ${usersInGroup} user(s) are still assigned to this group`
      );
    }

    // Kiểm tra có roles thuộc group này không
    const rolesInGroup = await prisma.auth_role.count({
      where: { group_id: id },
    });

    if (rolesInGroup > 0) {
      throw new Error(
        `Cannot delete group. ${rolesInGroup} role(s) are still assigned to this group`
      );
    }

    // Xóa group
    await prisma.auth_group.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Group deleted permanently",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Lấy tất cả roles của một group
 */
const getGroupRoles = async (groupId) => {
  try {
    // Kiểm tra group tồn tại
    const group = await prisma.auth_group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const roles = await prisma.auth_role.findMany({
      where: { group_id: groupId },
      orderBy: { name: "asc" },
    });

    return roles;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Lấy tất cả users trong một group
 */
const getGroupUsers = async (groupId, paging = { skip: 0, limit: 10 }) => {
  try {
    // Kiểm tra group tồn tại
    const group = await prisma.auth_group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const [users, total] = await Promise.all([
      prisma.auth_base_user.findMany({
        where: { group_id: groupId },
        skip: paging.skip,
        take: paging.limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          user_name: true,
          full_name: true,
          email: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.auth_base_user.count({
        where: { group_id: groupId },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        ...paging,
      },
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupRoles,
  getGroupUsers,
};
