const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { buildWhereClause } = require("../../../../utils/func");
const { hashPassword } = require("../../../../utils/bcrypt");
const { USER_STATUS, FR } = require("../../../../common");
const xlsx = require("xlsx");

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
  includeGroup = true, // Tham số mới để quyết định có join group không
}) => {
  try {
    const where = buildWhereClause(filters);

    // Nếu có select custom, đảm bảo có group_id để join
    const selectWithGroupId = select && includeGroup
      ? { ...select, group_id: true }
      : select;

    const [records, total] = await Promise.all([
      prisma.auth_base_user.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(selectWithGroupId && { select: selectWithGroupId }),
      }),
      prisma.auth_base_user.count({ where }),
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

    // Query tất cả groups một lần (giống leftJoin)
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

    // Gắn group vào từng user (giống kết quả leftJoin)
    const recordsWithGroup = records.map((user) => ({
      ...user,
      group: user.group_id ? groupMap[user.group_id] || null : null,
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

    // Lấy thông tin group nếu có
    if (user.group_id) {
      const group = await prisma.auth_group.findUnique({
        where: { id: user.group_id },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
        },
      });
      return { ...user, group };
    }

    return { ...user, group: null };
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
 * Xóa vĩnh viễn người dùng (cascade delete student và school user)
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

    // Sử dụng transaction để đảm bảo tất cả được xóa hoặc không xóa gì
    await prisma.$transaction(async (tx) => {
      // 1. Xóa student records (nếu có)
      await tx.auth_impl_user_student.deleteMany({
        where: { user_id: id },
      });

      // 2. Xóa school user records (nếu có)
      await tx.auth_impl_user_school.deleteMany({
        where: { user_id: id },
      });

      // 3. Xóa các refresh tokens liên quan (nếu có)
      await tx.auth_refresh_tokens.deleteMany({
        where: { user_id: id },
      });

      // 4. Cuối cùng xóa user
      await tx.auth_base_user.delete({
        where: { id },
      });
    });

    return {
      success: true,
      message: "User and all related records deleted permanently",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Import danh sách users từ file Excel
 */
const importUsers = async (fileBuffer) => {
  try {
    // Đọc file Excel
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Chuyển sheet thành JSON, bắt đầu từ row 3 (không có header)
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      range: 2, // Bắt đầu từ row 3 (index 2)
      header: ["STT", "Tên đăng nhập", "Họ và tên", "Email", "Số điện thoại", "Địa chỉ", "Mô tả", "Nhóm người dùng", "Mật khẩu"], // Định nghĩa header thủ công
      defval: "", // Giá trị mặc định cho cell trống
    });

    if (!jsonData || jsonData.length === 0) {
      throw new Error("File không có dữ liệu");
    }

    // Lấy danh sách groups để map tên -> ID
    const groups = await prisma.auth_group.findMany({
      select: { id: true, name: true, type: true },
    });
    const groupMap = {};
    groups.forEach(g => {
      groupMap[g.type.toUpperCase()] = g.id;
    });

    const results = {
      success: [],
      errors: [],
    };

    // Tạo workbook mới cho file lỗi
    const errorWorkbook = xlsx.utils.book_new();
    const errorData = [];
    const errorRows = []; // Lưu index của các row bị lỗi

    // Xử lý từng row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 3; // Row thực tế trong Excel (bắt đầu từ 3)
      let errorMessage = "";

      try {
        // Map các cột theo header
        const user_name = row["Tên đăng nhập"]?.toString().trim();
        const full_name = row["Họ và tên"]?.toString().trim();
        const email = row["Email"]?.toString().trim();
        const phone_number = row["Số điện thoại"]?.toString().trim();
        const address = row["Địa chỉ"]?.toString().trim();
        const groupType = row["Nhóm người dùng"]?.toString().trim().toUpperCase();
        const password = row["Mật khẩu"]?.toString().trim();

        // Validate required fields
        if (!user_name || !full_name) {
          errorMessage = "Thiếu tên đăng nhập hoặc họ tên";
          throw new Error(errorMessage);
        }

        // Validate group exists
        const group_id = groupMap[groupType];
        if (!group_id) {
          errorMessage = `Nhóm người dùng "${groupType}" không tồn tại`;
          throw new Error(errorMessage);
        }

        // Check username đã tồn tại
        const existingUser = await prisma.auth_base_user.findUnique({
          where: { user_name },
        });
        console.log('existingUser:', existingUser);

        if (existingUser) {
          errorMessage = "Tên đăng nhập đã tồn tại" + existingUser;
          throw new Error(errorMessage);
        }

        // Check email đã tồn tại
        if (email) {
          const existingEmail = await prisma.auth_base_user.findFirst({
            where: { email },
          });

          if (existingEmail) {
            errorMessage = `Email ${email} đã tồn tại`;
            throw new Error(errorMessage);
          }
        }

        // Tạo user
        const hashedPassword = await hashPassword(password || "123456", 10);

        const newUser = await prisma.auth_base_user.create({
          data: {
            user_name,
            full_name,
            email: email || null,
            phone_number: phone_number || null,
            address: address || null,
            password_hash: hashedPassword,
            group_id,
            status: "ACTIVE",
          },
          select: {
            id: true,
            user_name: true,
            full_name: true,
            email: true,
            phone_number: true,
            status: true,
          },
        });

        results.success.push({
          row: rowNumber,
          user: newUser,
        });
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          user_name: row["Tên đăng nhập"] || "",
          error: errorMessage || error.message,
        });

        // Thêm row vào file lỗi với cột "Lỗi"
        errorData.push({
          "STT": rowNumber - 2,
          "Tên đăng nhập": row["Tên đăng nhập"] || "",
          "Họ và tên": row["Họ và tên"] || "",
          "Email": row["Email"] || "",
          "Số điện thoại": row["Số điện thoại"] || "",
          "Địa chỉ": row["Địa chỉ"] || "",
          "Mô tả": row["Mô tả"] || "",
          "Nhóm người dùng": row["Nhóm người dùng"] || "",
          "Mật khẩu": row["Mật khẩu"] || "",
          "Lỗi": errorMessage || error.message,
        });
        errorRows.push(errorData.length); // Lưu index của row lỗi (1-based)
      }
    }

    // Nếu có lỗi, tạo file Excel với các row bị lỗi
    let errorFileBuffer = null;
    if (errorData.length > 0) {
      const errorWorksheet = xlsx.utils.json_to_sheet(errorData);

      // Thêm style cho header
      const headerRange = xlsx.utils.decode_range(errorWorksheet['!ref']);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col });
        if (!errorWorksheet[cellAddress]) continue;
        
        errorWorksheet[cellAddress].s = {
          fill: { fgColor: { rgb: "CCCCCC" } },
          font: { bold: true },
        };
      }

      // Bôi đỏ các row bị lỗi và cột "Lỗi"
      errorRows.forEach((rowIndex) => {
        const rowNumber = rowIndex; // rowIndex đã là 1-based
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = xlsx.utils.encode_cell({ r: rowNumber, c: col });
          if (!errorWorksheet[cellAddress]) {
            errorWorksheet[cellAddress] = { t: 's', v: '' };
          }
          
          errorWorksheet[cellAddress].s = {
            fill: { fgColor: { rgb: "FF0000" } },
            font: { color: { rgb: "FFFFFF" } },
          };
        }
      });

      // Set column widths
      errorWorksheet['!cols'] = [
        { wch: 5 },  // STT
        { wch: 15 }, // Tên đăng nhập
        { wch: 20 }, // Họ và tên
        { wch: 25 }, // Email
        { wch: 15 }, // Số điện thoại
        { wch: 30 }, // Địa chỉ
        { wch: 15 }, // Mô tả
        { wch: 20 }, // Nhóm người dùng
        { wch: 15 }, // Mật khẩu
        { wch: 40 }, // Lỗi
      ];

      xlsx.utils.book_append_sheet(errorWorkbook, errorWorksheet, "Lỗi");
      errorFileBuffer = xlsx.write(errorWorkbook, { 
        type: "buffer", 
        bookType: "xlsx",
        cellStyles: true,
      });
    }

    return {
      total: jsonData.length,
      success_count: results.success.length,
      error_count: results.errors.length,
      results,
      errorFileBuffer, // Buffer của file lỗi
    };
  } catch (error) {
    throw new Error(`Import failed: ${error.message}`);
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
  importUsers,
};
