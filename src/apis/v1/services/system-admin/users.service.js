const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { buildWhereClause } = require("../../../../utils/func");
const { hashPassword } = require("../../../../utils/bcrypt");
const { USER_STATUS, FR } = require("../../../../common");

const settingService = require("./settings.service");

const CURRENT_FR = FR.FR00001;

/**
 * Lấy danh sách người dùng với phân trang và lọc
 */
const getAllUsers = async ({
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
  select = null,
}) => {
  try {
    const where = buildWhereClause(filters);

    const [records, total] = await Promise.all([
      prisma.auth_base_user.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(select && { select }),
      }),
      prisma.auth_base_user.count({ where }),
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
 * Lấy người dùng với id và tùy chọn select dữ liệu
 */
const getUserById = async (id, select = null) => {
  try {
    const user = await prisma.auth_base_user.findUnique({
      where: { id },
      ...(select && { select }),
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Lấy người dùng với username và tùy chọn select dữ liệu
 */
const getUserByUsername = async (username, select = null) => {
  try {
    const user = await prisma.auth_base_user.findUnique({
      where: { user_name: username },
      ...(select && { select }),
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới người dùng
 */
const createUser = async (data) => {
  try {
    const {
      password,
      user_name,
      full_name,
      email,
      phone_number,
      address,
      description,
      group_id,
    } = data;

    // Kiểm tra email đã tồn tại
    if (email) {
      const existingEmail = await prisma.auth_base_user.findFirst({
        where: { email },
      });
      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }

    // Kiểm tra username đã tồn tại
    if (user_name) {
      const existingUsername = await prisma.auth_base_user.findFirst({
        where: { user_name },
      });
      if (existingUsername) {
        throw new Error("Username already exists");
      }
    }

    // Lấy mật khẩu mặc định nếu không có password
    let passwordToHash = password;
    if (!passwordToHash) {
      const defaultPass = await settingService.findSettingByKey(
        "DEFAULT_PASSWORD"
      );
      passwordToHash = defaultPass?.value_setting || "123456";
    }

    const password_hash = await hashPassword(passwordToHash, 10);

    const user = await prisma.auth_base_user.create({
      data: {
        user_name,
        full_name,
        email,
        phone_number,
        address,
        description,
        password_hash,
        group_id,
        status: USER_STATUS.INACTIVE,
        login_attempts: 0,
      },
    });

    // Không trả về password_hash
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật người dùng (chỉ profile)
 */
const updateProfile = async (id, data) => {
  try {
    // Kiểm tra user tồn tại
    const existingUser = await prisma.auth_base_user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    const {
      user_name,
      full_name,
      email,
      phone_number,
      address,
      description,
      group_id,
    } = data;

    // Kiểm tra email trùng (nếu thay đổi email)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.auth_base_user.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });
      if (emailExists) {
        throw new Error("Email already exists");
      }
    }

    // Kiểm tra username trùng (nếu thay đổi username)
    if (user_name && user_name !== existingUser.user_name) {
      const usernameExists = await prisma.auth_base_user.findFirst({
        where: {
          user_name,
          id: { not: id },
        },
      });
      if (usernameExists) {
        throw new Error("Username already exists");
      }
    }

    const user = await prisma.auth_base_user.update({
      where: { id },
      data: {
        user_name,
        full_name,
        email,
        phone_number,
        address,
        description,
        group_id,
        updated_at: new Date(),
      },
    });

    // Không trả về password_hash
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Thay đổi mật khẩu người dùng
 */
const changePassword = async (id, newPassword) => {
  try {
    // Kiểm tra user tồn tại
    const existingUser = await prisma.auth_base_user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const password_hash = await hashPassword(newPassword, 10);

    await prisma.auth_base_user.update({
      where: { id },
      data: {
        password_hash,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Thay đổi trạng thái người dùng
 */
const updateStatus = async (id, status) => {
  try {
    // Kiểm tra user tồn tại
    const existingUser = await prisma.auth_base_user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Validate status
    const validStatuses = ["ACTIVE", "INACTIVE", "BANNER"];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    const user = await prisma.auth_base_user.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    // Không trả về password_hash
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa vĩnh viễn người dùng
 */
const deleteUser = async (id) => {
  try {
    // Kiểm tra user tồn tại
    const existingUser = await prisma.auth_base_user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Xóa các refresh tokens liên quan (nếu có)
    await prisma.auth_refresh_tokens.deleteMany({
      where: { user_id: id },
    });

    // Xóa user
    await prisma.auth_base_user.delete({
      where: { id },
    });

    return {
      success: true,
      message: "User deleted permanently",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateProfile,
  changePassword,
  updateStatus,
  deleteUser,
  getUserByUsername,
};
