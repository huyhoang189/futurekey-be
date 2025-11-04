const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { buildWhereClause } = require("../../../../utils/func");
const { FR } = require("../../../../common");

const CURRENT_FR = FR.FR00005 || "FR00005";

/**
 * Lấy danh sách roles với phân trang và lọc
 */
const getAllRoles = async ({
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
  select = null,
  includeGroup = true,
}) => {
  try {
    const where = buildWhereClause(filters);

    // Nếu có select custom, đảm bảo có group_id để join
    const selectWithGroupId = select && includeGroup
      ? { ...select, group_id: true }
      : select;

    const [records, total] = await Promise.all([
      prisma.auth_role.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(selectWithGroupId && { select: selectWithGroupId }),
      }),
      prisma.auth_role.count({ where }),
    ]);

    // Chỉ join group nếu includeGroup = true
    if (!includeGroup) {
      return {
        data: records,
        meta: {
          total,
          ...paging,
        },
      };
    }

    // Optimize: Lấy tất cả group_ids unique
    const groupIds = [...new Set(records.map((r) => r.group_id).filter(Boolean))];

    // Query tất cả groups một lần
    const groups = groupIds.length > 0
      ? await prisma.auth_group.findMany({
          where: { id: { in: groupIds } },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
          },
        })
      : [];

    // Map groups thành object để lookup nhanh
    const groupMap = Object.fromEntries(groups.map((g) => [g.id, g]));

    // Gắn group vào từng role
    const recordsWithGroup = records.map((role) => ({
      ...role,
      group: role.group_id ? groupMap[role.group_id] || null : null,
    }));

    return {
      data: recordsWithGroup,
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
 * Lấy role theo id
 */
const getRoleById = async (id, select = null, includeGroup = true) => {
  try {
    const selectWithGroupId = select && includeGroup
      ? { ...select, group_id: true }
      : select;

    const role = await prisma.auth_role.findUnique({
      where: { id },
      ...(selectWithGroupId && { select: selectWithGroupId }),
    });

    if (!role) {
      throw new Error("Role not found");
    }

    // Lấy thông tin group nếu có và includeGroup = true
    if (includeGroup && role.group_id) {
      const group = await prisma.auth_group.findUnique({
        where: { id: role.group_id },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
        },
      });
      return { ...role, group };
    }

    return { ...role, group: null };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới role
 */
const createRole = async (data) => {
  try {
    const { group_id, name, description } = data;

    // Kiểm tra group tồn tại
    if (group_id) {
      const groupExists = await prisma.auth_group.findUnique({
        where: { id: group_id },
      });
      if (!groupExists) {
        throw new Error("Group not found");
      }
    }

    // Kiểm tra tên role đã tồn tại trong cùng group
    if (name && group_id) {
      const existingRole = await prisma.auth_role.findFirst({
        where: {
          name,
          group_id,
        },
      });
      if (existingRole) {
        throw new Error("Role name already exists in this group");
      }
    }

    const role = await prisma.auth_role.create({
      data: {
        group_id,
        name,
        description,
      },
    });

    return role;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật role
 */
const updateRole = async (id, data) => {
  try {
    // Kiểm tra role tồn tại
    const existingRole = await prisma.auth_role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new Error("Role not found");
    }

    const { group_id, name, description } = data;

    // Kiểm tra group tồn tại nếu thay đổi group
    if (group_id && group_id !== existingRole.group_id) {
      const groupExists = await prisma.auth_group.findUnique({
        where: { id: group_id },
      });
      if (!groupExists) {
        throw new Error("Group not found");
      }
    }

    // Kiểm tra tên role trùng trong cùng group
    if (name || group_id) {
      const checkName = name || existingRole.name;
      const checkGroupId = group_id || existingRole.group_id;

      const roleExists = await prisma.auth_role.findFirst({
        where: {
          name: checkName,
          group_id: checkGroupId,
          id: { not: id },
        },
      });
      if (roleExists) {
        throw new Error("Role name already exists in this group");
      }
    }

    const role = await prisma.auth_role.update({
      where: { id },
      data: {
        group_id,
        name,
        description,
        updated_at: new Date(),
      },
    });

    return role;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa vĩnh viễn role
 */
const deleteRole = async (id) => {
  try {
    // Kiểm tra role tồn tại
    const existingRole = await prisma.auth_role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new Error("Role not found");
    }

    // TODO: Kiểm tra có users/permissions đang sử dụng role này không
    // Tùy thuộc vào business logic của bạn

    // Xóa role
    await prisma.auth_role.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Role deleted permanently",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
