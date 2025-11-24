const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("../../../../utils/bcrypt");
const xlsx = require("xlsx");

/**
 * Lấy default school user group ID (cho giáo viên/nhân viên trường)
 */
const getDefaultSchoolUserGroupId = async () => {
  try {
    const schoolUserGroup = await prisma.auth_group.findFirst({
      where: {
        OR: [
          { type: "SCHOOL_TEACHER" },
          { name: { contains: "Giáo viên" } },
        ]
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
const getAllSchoolUsers = async ({ filters = {}, paging = {}, orderBy = {}, search = '' }) => {
  const { skip = 0, limit = 10 } = paging;

  // Nếu có search, cần tìm user_id và school_id trước
  let searchUserIds = [];
  let searchSchoolIds = [];

  if (search) {
    // Tìm users matching search
    const matchingUsers = await prisma.auth_base_user.findMany({
      where: {
        OR: [
          { full_name: { contains: search } },
          { email: { contains: search } },
          { phone_number: { contains: search } },
        ],
      },
      select: { id: true },
    });
    searchUserIds = matchingUsers.map(u => u.id);

    // Tìm schools matching search
    const matchingSchools = await prisma.schools.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          // { address: { contains: search } },
        ],
      },
      select: { id: true },
    });
    searchSchoolIds = matchingSchools.map(s => s.id);

    // Thêm điều kiện search vào filters
    if (!filters.OR) {
      filters.OR = [];
    }
    
    if (searchUserIds.length > 0) {
      filters.OR.push({ user_id: { in: searchUserIds } });
    }
    if (searchSchoolIds.length > 0) {
      filters.OR.push({ school_id: { in: searchSchoolIds } });
    }

    // Nếu không tìm thấy user hoặc school nào, và filter.OR chỉ có description
    // thì giữ nguyên filter description đã có từ controller
  }

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
        password_hash: password ? await bcrypt.hashPassword(password, 10) : await bcrypt.hashPassword('123456', 10),
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
const updateSchoolUser = async (id, updateData) => {
  const { school_user, base_user } = updateData;

  // Check school user exists
  const existingSchoolUser = await prisma.auth_impl_user_school.findUnique({
    where: { id },
  });

  if (!existingSchoolUser) {
    throw new Error("School user not found");
  }

  return await prisma.$transaction(async (tx) => {
    let updatedSchoolUser = null;
    let updatedBaseUser = null;

    // Update school_user properties if provided
    if (school_user) {
      const { school_id, description } = school_user;

      // Check if there's any field to update
      const hasUpdate = school_id !== undefined || description !== undefined;

      if (hasUpdate) {
        // Validate school exists if school_id is being updated
        if (school_id !== undefined) {
          const school = await tx.schools.findUnique({
            where: { id: school_id },
          });
          if (!school) {
            throw new Error("School not found");
          }
        }

        updatedSchoolUser = await tx.auth_impl_user_school.update({
          where: { id },
          data: {
            ...(school_id !== undefined && { school_id }),
            ...(description !== undefined && { description }),
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
      }
    }

    // Update base_user properties if provided
    if (base_user && existingSchoolUser.user_id) {
      const {
        user_name,
        full_name,
        email,
        phone_number,
        address,
        status,
      } = base_user;

      // Check if there's any field to update
      const hasUpdate = user_name !== undefined || full_name !== undefined || 
                       email !== undefined || phone_number !== undefined || 
                       address !== undefined || status !== undefined;

      if (hasUpdate) {
        // Check username duplicate if being updated
        if (user_name !== undefined) {
          const existingUser = await tx.auth_base_user.findFirst({
            where: {
              user_name,
              NOT: { id: existingSchoolUser.user_id },
            },
          });
          if (existingUser) {
            throw new Error("Username already exists");
          }
        }

        // Check email duplicate if being updated
        if (email !== undefined) {
          const existingEmail = await tx.auth_base_user.findFirst({
            where: {
              email,
              NOT: { id: existingSchoolUser.user_id },
            },
          });
          if (existingEmail) {
            throw new Error("Email already exists");
          }
        }

        updatedBaseUser = await tx.auth_base_user.update({
          where: { id: existingSchoolUser.user_id },
          data: {
            ...(user_name !== undefined && { user_name }),
            ...(full_name !== undefined && { full_name }),
            ...(email !== undefined && { email }),
            ...(phone_number !== undefined && { phone_number }),
            ...(address !== undefined && { address }),
            ...(status !== undefined && { status }),
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
      }
    }

    // Get final state
    const finalSchoolUser = updatedSchoolUser || await tx.auth_impl_user_school.findUnique({
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

    const [user, school] = await Promise.all([
      finalSchoolUser.user_id ? tx.auth_base_user.findUnique({
        where: { id: finalSchoolUser.user_id },
        select: {
          id: true,
          user_name: true,
          full_name: true,
          email: true,
          phone_number: true,
          address: true,
          status: true,
        },
      }) : null,
      finalSchoolUser.school_id ? tx.schools.findUnique({
        where: { id: finalSchoolUser.school_id },
        select: { id: true, name: true, address: true },
      }) : null,
    ]);

    return {
      ...finalSchoolUser,
      user,
      school,
    };
  });
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

/**
 * Import danh sách school users (teachers) từ file Excel
 */
const importSchoolUsers = async (fileBuffer, school_id) => {
  try {
    // Validate school exists
    const school = await prisma.schools.findUnique({
      where: { id: school_id },
      select: { id: true, name: true },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Đọc file Excel
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Chuyển sheet thành JSON, bắt đầu từ row 2 (không có header)
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      range: 1, // Bắt đầu từ row 2 (index 1)
      header: [
        "STT",
        "Tên đăng nhập",
        "Họ và tên",
        "Email",
        "Số điện thoại",
        "Địa chỉ",
        "Mật khẩu",
        "Mô tả",
      ],
      defval: "",
    });

    if (!jsonData || jsonData.length === 0) {
      throw new Error("File không có dữ liệu");
    }

    // Lấy teacher group
    const teacherGroup = await getDefaultSchoolUserGroupId();

    const results = {
      success: [],
      errors: [],
    };

    // Tạo workbook mới cho file lỗi
    const errorWorkbook = xlsx.utils.book_new();
    const errorData = [];
    const errorRows = [];

    // Xử lý từng row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 3;
      let errorMessage = "";

      try {
        // Map các cột
        const user_name = row["Tên đăng nhập"]?.toString().trim();
        const full_name = row["Họ và tên"]?.toString().trim();
        const email = row["Email"]?.toString().trim();
        const phone_number = row["Số điện thoại"]?.toString().trim();
        const address = row["Địa chỉ"]?.toString().trim();
        const password = row["Mật khẩu"]?.toString().trim();
        const description = row["Mô tả"]?.toString().trim();

        // Validate required fields
        if (!user_name || !full_name) {
          errorMessage = "Thiếu tên đăng nhập hoặc họ tên";
          throw new Error(errorMessage);
        }

        // Check username đã tồn tại
        const existingUser = await prisma.auth_base_user.findUnique({
          where: { user_name },
        });

        if (existingUser) {
          errorMessage = "Tên đăng nhập đã tồn tại";
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

        // Tạo user và school user trong transaction
        const result = await prisma.$transaction(async (tx) => {
          // 1. Tạo user
          const user = await tx.auth_base_user.create({
            data: {
              user_name,
              full_name,
              email: email || null,
              phone_number: phone_number || null,
              address: address || null,
              password_hash: await bcrypt.hashPassword(password || "123456", 10),
              group_id: teacherGroup,
              status: "ACTIVE",
            },
          });

          // 2. Tạo school user
          const schoolUser = await tx.auth_impl_user_school.create({
            data: {
              user_id: user.id,
              school_id,
              description: description || null,
            },
            select: {
              id: true,
              user_id: true,
              school_id: true,
              description: true,
            },
          });

          return { user, schoolUser };
        });

        results.success.push({
          row: rowNumber,
          schoolUser: result.schoolUser,
          user: result.user,
        });
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          user_name: row["Tên đăng nhập"] || "",
          error: errorMessage || error.message,
        });

        // Thêm row vào file lỗi
        errorData.push({
          "STT": rowNumber - 1,
          "Tên đăng nhập": row["Tên đăng nhập"] || "",
          "Họ và tên": row["Họ và tên"] || "",
          "Email": row["Email"] || "",
          "Số điện thoại": row["Số điện thoại"] || "",
          "Địa chỉ": row["Địa chỉ"] || "",
          "Mật khẩu": row["Mật khẩu"] || "",
          "Mô tả": row["Mô tả"] || "",
          "Lỗi": errorMessage || error.message,
        });
        errorRows.push(errorData.length);
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

      // Bôi đỏ các row bị lỗi
      errorRows.forEach((rowIndex) => {
        const rowNumber = rowIndex;
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
        { wch: 15 }, // Mật khẩu
        { wch: 20 }, // Mô tả
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
      errorFileBuffer,
    };
  } catch (error) {
    throw new Error(`Import failed: ${error.message}`);
  }
};

module.exports = {
  getAllSchoolUsers,
  getSchoolUserById,
  createSchoolUser,
  updateSchoolUser,
  updateSchoolUserUser,
  deleteSchoolUser,
  checkUserSchoolAssociation,
  importSchoolUsers,
};
