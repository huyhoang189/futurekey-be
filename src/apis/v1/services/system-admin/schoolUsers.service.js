const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("../../../../utils/bcrypt");

/**
 * Lấy default school user group ID (cho giáo viên/nhân viên trường)
 */
const getDefaultSchoolUserGroupId = async () => {
  try {
    const schoolUserGroup = await prisma.auth_group.findFirst({
      where: {
        OR: [
          { type: "TEACHER" },
          { type: "SCHOOL_STAFF" },
          { name: { contains: "Teacher" } },
          { name: { contains: "Giáo viên" } },
          { name: { contains: "Staff" } },
          { name: { contains: "Nhân viên" } },
        ],
      },
    });

    return schoolUserGroup?.id || null;
  } catch (error) {
    return null;
  }
};

/**
 * Lấy danh sách school users với phân trang và tìm kiếm
 */
const getAllSchoolUsers = async ({
  filters = {},
  paging = {},
  orderBy = {},
}) => {
  const { skip = 0, limit = 10 } = paging;

  // Đếm tổng số records
  const total = await prisma.auth_impl_user_school.count({
    where: filters,
  });

  // Lấy dữ liệu với phân trang
  const data = await prisma.auth_impl_user_school.findMany({
    where: filters,
    skip: skip,
    take: limit,
    orderBy: orderBy,
    select: {
      id: true,
      user_id: true,
      school_id: true,
      description: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Manual join với users, schools
  if (data.length > 0) {
    // Get unique IDs
    const userIds = [
      ...new Set(data.map((schoolUser) => schoolUser.user_id).filter(Boolean)),
    ];
    const schoolIds = [
      ...new Set(
        data.map((schoolUser) => schoolUser.school_id).filter(Boolean)
      ),
    ];

    // Parallel queries
    const [users, schools] = await Promise.all([
      userIds.length > 0
        ? prisma.auth_base_user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              user_name: true,
              full_name: true,
              email: true,
              phone_number: true,
              address: true,
              status: true,
              group_id: true,
            },
          })
        : [],
      schoolIds.length > 0
        ? prisma.schools.findMany({
            where: { id: { in: schoolIds } },
            select: { id: true, name: true, address: true },
          })
        : [],
    ]);

    // Create maps for fast lookup
    const usersMap = Object.fromEntries(users.map((user) => [user.id, user]));
    const schoolsMap = Object.fromEntries(
      schools.map((school) => [school.id, school])
    );

    // Attach related data
    data.forEach((schoolUser) => {
      schoolUser.user = schoolUser.user_id
        ? usersMap[schoolUser.user_id] || null
        : null;
      schoolUser.school = schoolUser.school_id
        ? schoolsMap[schoolUser.school_id] || null
        : null;
    });
  }

  return {
    data,
    meta: {
      total,
      skip,
      limit,
    },
  };
};

/**
 * Lấy thông tin school user theo ID
 */
const getSchoolUserById = async (id) => {
  const schoolUser = await prisma.auth_impl_user_school.findUnique({
    where: { id },
    select: {
      id: true,
      user_id: true,
      school_id: true,
      description: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!schoolUser) {
    throw new Error("School user not found");
  }

  // Manual join với user, school
  const [user, school] = await Promise.all([
    schoolUser.user_id
      ? prisma.auth_base_user.findUnique({
          where: { id: schoolUser.user_id },
          select: {
            id: true,
            user_name: true,
            full_name: true,
            email: true,
            phone_number: true,
            address: true,
            status: true,
            group_id: true,
          },
        })
      : null,
    schoolUser.school_id
      ? prisma.schools.findUnique({
          where: { id: schoolUser.school_id },
          select: { id: true, name: true, address: true },
        })
      : null,
  ]);

  schoolUser.user = user;
  schoolUser.school = school;

  return schoolUser;
};

/**
 * Tạo mới school user (tự động tạo user account)
 */
const createSchoolUser = async (schoolUserData) => {
  const {
    // User fields
    user_name,
    full_name,
    email,
    phone_number,
    password,
    address,
    // School user fields
    school_id,
    description,
  } = schoolUserData;

  return await prisma.$transaction(async (tx) => {
    // Validate school exists
    if (school_id) {
      const school = await tx.schools.findUnique({
        where: { id: school_id },
      });
      if (!school) {
        throw new Error("School not found");
      }
    }

    // Check if user_name already exists
    if (user_name) {
      const existingUser = await tx.auth_base_user.findUnique({
        where: { user_name },
      });
      if (existingUser) {
        throw new Error("Username already exists");
      }
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await tx.auth_base_user.findFirst({
        where: { email },
      });
      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }

    // Get default school user group
    const schoolUserGroupId = await getDefaultSchoolUserGroupId();

    // 1. Create user account first
    const user = await tx.auth_base_user.create({
      data: {
        user_name,
        full_name,
        email,
        phone_number,
        password_hash: password
          ? await bcrypt.hashPassword(password, 10)
          : await bcrypt.hashPassword("teacher123", 10),
        address,
        group_id: schoolUserGroupId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        phone_number: true,
        address: true,
        status: true,
        group_id: true,
        created_at: true,
      },
    });

    // 2. Create school user info
    const schoolUser = await tx.auth_impl_user_school.create({
      data: {
        user_id: user.id,
        school_id,
        description,
      },
      select: {
        id: true,
        user_id: true,
        school_id: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Get school data for response
    const school = school_id
      ? await tx.schools.findUnique({
          where: { id: school_id },
          select: { id: true, name: true, address: true },
        })
      : null;

    return {
      schoolUser: {
        ...schoolUser,
        user,
        school,
      },
      user,
    };
  });
};

/**
 * Cập nhật school user info
 */
const updateSchoolUser = async (id, schoolUserData) => {
  const { school_id, description } = schoolUserData;

  // Check school user exists
  const existingSchoolUser = await prisma.auth_impl_user_school.findUnique({
    where: { id },
  });

  if (!existingSchoolUser) {
    throw new Error("School user not found");
  }

  // Validate school exists
  if (school_id) {
    const school = await prisma.schools.findUnique({
      where: { id: school_id },
    });
    if (!school) {
      throw new Error("School not found");
    }
  }

  const schoolUser = await prisma.auth_impl_user_school.update({
    where: { id },
    data: {
      school_id,
      description,
    },
    select: {
      id: true,
      user_id: true,
      school_id: true,
      description: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Get related data
  const [user, school] = await Promise.all([
    schoolUser.user_id
      ? prisma.auth_base_user.findUnique({
          where: { id: schoolUser.user_id },
          select: {
            id: true,
            user_name: true,
            full_name: true,
            email: true,
            phone_number: true,
            address: true,
            status: true,
          },
        })
      : null,
    schoolUser.school_id
      ? prisma.schools.findUnique({
          where: { id: schoolUser.school_id },
          select: { id: true, name: true, address: true },
        })
      : null,
  ]);

  schoolUser.user = user;
  schoolUser.school = school;

  return schoolUser;
};

/**
 * Cập nhật user info của school user
 */
const updateSchoolUserUser = async (id, userData) => {
  const { user_name, full_name, email, phone_number, address } = userData;

  // Get school user info
  const schoolUser = await prisma.auth_impl_user_school.findUnique({
    where: { id },
  });

  if (!schoolUser) {
    throw new Error("School user not found");
  }

  if (!schoolUser.user_id) {
    throw new Error("School user has no associated user account");
  }

  // Check username duplicate
  if (user_name) {
    const existingUser = await prisma.auth_base_user.findFirst({
      where: {
        user_name,
        NOT: { id: schoolUser.user_id },
      },
    });
    if (existingUser) {
      throw new Error("Username already exists");
    }
  }

  // Check email duplicate
  if (email) {
    const existingEmail = await prisma.auth_base_user.findFirst({
      where: {
        email,
        NOT: { id: schoolUser.user_id },
      },
    });
    if (existingEmail) {
      throw new Error("Email already exists");
    }
  }

  // Update user
  const user = await prisma.auth_base_user.update({
    where: { id: schoolUser.user_id },
    data: {
      user_name,
      full_name,
      email,
      phone_number,
      address,
    },
    select: {
      id: true,
      user_name: true,
      full_name: true,
      email: true,
      phone_number: true,
      address: true,
      status: true,
    },
  });

  return user;
};

/**
 * Xóa school user (có thể giữ lại user account)
 */
const deleteSchoolUser = async (id, options = {}) => {
  const { deleteUser = false } = options;

  return await prisma.$transaction(async (tx) => {
    // Get school user info
    const schoolUser = await tx.auth_impl_user_school.findUnique({
      where: { id },
    });

    if (!schoolUser) {
      throw new Error("School user not found");
    }

    // Delete school user record
    await tx.auth_impl_user_school.delete({
      where: { id },
    });

    // Optionally delete user account
    if (deleteUser && schoolUser.user_id) {
      // Check if user is used in other places
      const [userStudent, refreshTokens] = await Promise.all([
        tx.auth_impl_user_student.findFirst({
          where: { user_id: schoolUser.user_id },
        }),
        tx.auth_refresh_tokens.findFirst({
          where: { user_id: schoolUser.user_id },
        }),
      ]);

      if (!userStudent && !refreshTokens) {
        await tx.auth_base_user.delete({
          where: { id: schoolUser.user_id },
        });
      }
    }

    return {
      message: deleteUser
        ? "Delete school user and user account successfully"
        : "Delete school user successfully",
    };
  });
};

/**
 * Kiểm tra user đã là school user của trường nào chưa
 */
const checkUserSchoolAssociation = async (userId) => {
  const schoolUser = await prisma.auth_impl_user_school.findFirst({
    where: { user_id: userId },
    select: {
      id: true,
      school_id: true,
    },
  });

  return schoolUser;
};

module.exports = {
  getAllSchoolUsers,
  getSchoolUserById,
  createSchoolUser,
  updateSchoolUser,
  updateSchoolUserUser,
  deleteSchoolUser,
  checkUserSchoolAssociation,
};
