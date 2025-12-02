const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("../../../../utils/bcrypt");
const xlsx = require("xlsx");

/**
 * Generate mã học sinh từ tên lớp
 * Format: Lop10A_HS_123456789
 */
const generateStudentCode = async (className) => {
  if (!className) {
    // Nếu không có lớp, dùng format mặc định
    const timestamp = Date.now();
    return `HS_${timestamp}`;
  }

  // Chuẩn hóa tên lớp: "Lớp 10A" -> "Lop10A"
  const normalizedClassName = className
    .replace(/Lớp\s*/gi, "Lop")
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

  // Generate số ngẫu nhiên 9 chữ số
  const randomNumber = Math.floor(100000000 + Math.random() * 900000000);

  const code = `${normalizedClassName}_HS_${randomNumber}`;

  // Check duplicate
  const existing = await prisma.auth_impl_user_student.findFirst({
    where: { student_code: code },
  });

  if (existing) {
    // Nếu trùng, generate lại
    return generateStudentCode(className);
  }

  return code;
};

/**
 * Lấy default student group ID
 */
const getDefaultStudentGroupId = async () => {
  const studentGroup = await prisma.auth_group.findFirst({
    where: {
      OR: [
        { type: "SCHOOL_STUDENT" },
        { name: { contains: "Student" } },
        { name: { contains: "Học sinh" } },
      ],
    },
  });

  return studentGroup?.id || null;
};

/**
 * Lấy danh sách students với phân trang và tìm kiếm
 */
const getAllStudents = async ({
  filters = {},
  paging = {},
  orderBy = {},
  search = "",
}) => {
  const { skip = 0, limit = 10 } = paging;

  // Nếu có search, cần tìm user_id, school_id, class_id trước
  let searchUserIds = [];
  let searchSchoolIds = [];
  let searchClassIds = [];

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
    searchUserIds = matchingUsers.map((u) => u.id);

    // Tìm schools matching search
    const matchingSchools = await prisma.schools.findMany({
      where: {
        OR: [{ name: { contains: search } }, { address: { contains: search } }],
      },
      select: { id: true },
    });
    searchSchoolIds = matchingSchools.map((s) => s.id);

    // Tìm classes matching search
    const matchingClasses = await prisma.classes.findMany({
      where: {
        OR: [{ name: { contains: search } }],
      },
      select: { id: true },
    });
    searchClassIds = matchingClasses.map((c) => c.id);

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
    if (searchClassIds.length > 0) {
      filters.OR.push({ class_id: { in: searchClassIds } });
    }
  }

  // Đếm tổng số records
  const total = await prisma.auth_impl_user_student.count({
    where: filters,
  });

  // Lấy dữ liệu với phân trang
  const data = await prisma.auth_impl_user_student.findMany({
    where: filters,
    skip: skip,
    take: limit,
    orderBy: orderBy,
    select: {
      id: true,
      user_id: true,
      school_id: true,
      class_id: true,
      student_code: true,
      sex: true,
      birthday: true,
      description: true,
      major_interest: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Manual join với users, schools, classes
  if (data.length > 0) {
    // Get unique IDs
    const userIds = [
      ...new Set(data.map((student) => student.user_id).filter(Boolean)),
    ];
    const schoolIds = [
      ...new Set(data.map((student) => student.school_id).filter(Boolean)),
    ];
    const classIds = [
      ...new Set(data.map((student) => student.class_id).filter(Boolean)),
    ];

    // Parallel queries
    const [users, schools, classes] = await Promise.all([
      userIds.length > 0
        ? prisma.auth_base_user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              user_name: true,
              full_name: true,
              email: true,
              phone_number: true,
              status: true,
            },
          })
        : [],
      schoolIds.length > 0
        ? prisma.schools.findMany({
            where: { id: { in: schoolIds } },
            select: { id: true, name: true },
          })
        : [],
      classIds.length > 0
        ? prisma.classes.findMany({
            where: { id: { in: classIds } },
            select: { id: true, name: true, grade_level: true },
          })
        : [],
    ]);

    // Create maps for fast lookup
    const usersMap = Object.fromEntries(users.map((user) => [user.id, user]));
    const schoolsMap = Object.fromEntries(
      schools.map((school) => [school.id, school])
    );
    const classesMap = Object.fromEntries(classes.map((cls) => [cls.id, cls]));

    // Attach related data
    data.forEach((student) => {
      student.user = student.user_id ? usersMap[student.user_id] || null : null;
      student.school = student.school_id
        ? schoolsMap[student.school_id] || null
        : null;
      student.class = student.class_id
        ? classesMap[student.class_id] || null
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
 * Lấy thông tin student theo ID
 */
const getStudentById = async (id) => {
  const student = await prisma.auth_impl_user_student.findUnique({
    where: { id },
    select: {
      id: true,
      user_id: true,
      school_id: true,
      class_id: true,
      student_code: true,
      sex: true,
      birthday: true,
      description: true,
      major_interest: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Manual join với user, school, class
  const [user, school, classData] = await Promise.all([
    student.user_id
      ? prisma.auth_base_user.findUnique({
          where: { id: student.user_id },
          select: {
            id: true,
            user_name: true,
            full_name: true,
            email: true,
            phone_number: true,
            status: true,
            group_id: true,
          },
        })
      : null,
    student.school_id
      ? prisma.schools.findUnique({
          where: { id: student.school_id },
          select: { id: true, name: true },
        })
      : null,
    student.class_id
      ? prisma.classes.findUnique({
          where: { id: student.class_id },
          select: { id: true, name: true, grade_level: true },
        })
      : null,
  ]);

  student.user = user;
  student.school = school;
  student.class = classData;

  return student;
};

/**
 * Lấy thông tin student theo ID
 */
const getStudentByUserId = async (user_id) => {
  const student = await prisma.auth_impl_user_student.findFirst({
    where: { user_id },
    select: {
      id: true,
      user_id: true,
      school_id: true,
      class_id: true,
      student_code: true,
      sex: true,
      birthday: true,
      description: true,
      major_interest: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Manual join với user, school, class
  const [user, school, classData] = await Promise.all([
    student.user_id
      ? prisma.auth_base_user.findUnique({
          where: { id: student.user_id },
          select: {
            id: true,
            user_name: true,
            full_name: true,
            email: true,
            phone_number: true,
            status: true,
            group_id: true,
          },
        })
      : null,
    student.school_id
      ? prisma.schools.findUnique({
          where: { id: student.school_id },
          select: { id: true, name: true },
        })
      : null,
    student.class_id
      ? prisma.classes.findUnique({
          where: { id: student.class_id },
          select: { id: true, name: true, grade_level: true },
        })
      : null,
  ]);

  student.user = user;
  student.school = school;
  student.class = classData;

  return student;
};

/**
 * Tạo mới student (tự động tạo user account)
 */
const createStudent = async (studentData) => {
  const {
    // User fields
    user_name,
    full_name,
    email,
    phone_number,
    password,
    address,
    // Student fields
    school_id,
    class_id,
    sex,
    birthday,
    description,
    major_interest,
  } = studentData;

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

    // Validate class exists
    if (class_id) {
      const classData = await tx.classes.findUnique({
        where: { id: class_id },
      });
      if (!classData) {
        throw new Error("Class not found");
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

    // Get default student group
    const studentGroupId = await getDefaultStudentGroupId();

    // Get class name for student code
    let className = null;
    if (class_id) {
      const classData = await tx.classes.findUnique({
        where: { id: class_id },
        select: { name: true },
      });
      className = classData?.name;
    }

    // Generate student code
    const student_code = await generateStudentCode(className);

    // 1. Create user account first
    const user = await tx.auth_base_user.create({
      data: {
        user_name,
        full_name,
        email,
        phone_number,
        password_hash: password
          ? await bcrypt.hashPassword(password, 10)
          : await bcrypt.hashPassword("123456", 10),
        address,
        group_id: studentGroupId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        phone_number: true,
        status: true,
        group_id: true,
        created_at: true,
      },
    });

    // 2. Create student info
    const student = await tx.auth_impl_user_student.create({
      data: {
        user_id: user.id,
        school_id,
        class_id,
        student_code,
        sex,
        birthday: birthday ? new Date(birthday) : null,
        description,
        major_interest,
      },
      select: {
        id: true,
        user_id: true,
        school_id: true,
        class_id: true,
        student_code: true,
        sex: true,
        birthday: true,
        description: true,
        major_interest: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Get related data for response
    const [school, classData] = await Promise.all([
      school_id
        ? tx.schools.findUnique({
            where: { id: school_id },
            select: { id: true, name: true },
          })
        : null,
      class_id
        ? tx.classes.findUnique({
            where: { id: class_id },
            select: { id: true, name: true, grade_level: true },
          })
        : null,
    ]);

    return {
      student: {
        ...student,
        user,
        school,
        class: classData,
      },
      user,
    };
  });
};

/**
 * Cập nhật student info
 */
const updateStudent = async (id, updateData) => {
  const { student, base_user } = updateData;

  // Check student exists
  const existingStudent = await prisma.auth_impl_user_student.findUnique({
    where: { id },
  });

  if (!existingStudent) {
    throw new Error("Student not found");
  }

  return await prisma.$transaction(async (tx) => {
    // Update student properties if provided
    if (student) {
      const {
        school_id,
        class_id,
        sex,
        birthday,
        description,
        major_interest,
      } = student;

      // Check if there's any field to update
      const hasUpdate =
        school_id !== undefined ||
        class_id !== undefined ||
        sex !== undefined ||
        birthday !== undefined ||
        description !== undefined ||
        major_interest !== undefined;

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

        // Validate class exists if class_id is being updated
        if (class_id !== undefined) {
          const classData = await tx.classes.findUnique({
            where: { id: class_id },
          });
          if (!classData) {
            throw new Error("Class not found");
          }
        }

        await tx.auth_impl_user_student.update({
          where: { id },
          data: {
            ...(school_id !== undefined && { school_id }),
            ...(class_id !== undefined && { class_id }),
            ...(sex !== undefined && { sex }),
            ...(birthday !== undefined && {
              birthday: birthday ? new Date(birthday) : null,
            }),
            ...(description !== undefined && { description }),
            ...(major_interest !== undefined && { major_interest }),
          },
        });
      }
    }

    // Update base_user properties if provided
    if (base_user && existingStudent.user_id) {
      const { user_name, full_name, email, phone_number, address, status } =
        base_user;

      // Check if there's any field to update
      const hasUpdate =
        user_name !== undefined ||
        full_name !== undefined ||
        email !== undefined ||
        phone_number !== undefined ||
        address !== undefined ||
        status !== undefined;

      if (hasUpdate) {
        // Check username duplicate if being updated
        if (user_name !== undefined) {
          const existingUser = await tx.auth_base_user.findFirst({
            where: {
              user_name,
              NOT: { id: existingStudent.user_id },
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
              NOT: { id: existingStudent.user_id },
            },
          });
          if (existingEmail) {
            throw new Error("Email already exists");
          }
        }

        await tx.auth_base_user.update({
          where: { id: existingStudent.user_id },
          data: {
            ...(user_name !== undefined && { user_name }),
            ...(full_name !== undefined && { full_name }),
            ...(email !== undefined && { email }),
            ...(phone_number !== undefined && { phone_number }),
            ...(address !== undefined && { address }),
            ...(status !== undefined && { status }),
          },
        });
      }
    }

    // Get final state
    const finalStudent = await tx.auth_impl_user_student.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        school_id: true,
        class_id: true,
        student_code: true,
        sex: true,
        birthday: true,
        description: true,
        major_interest: true,
        created_at: true,
        updated_at: true,
      },
    });

    const [user, school, classData] = await Promise.all([
      finalStudent.user_id
        ? tx.auth_base_user.findUnique({
            where: { id: finalStudent.user_id },
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
      finalStudent.school_id
        ? tx.schools.findUnique({
            where: { id: finalStudent.school_id },
            select: { id: true, name: true },
          })
        : null,
      finalStudent.class_id
        ? tx.classes.findUnique({
            where: { id: finalStudent.class_id },
            select: { id: true, name: true, grade_level: true },
          })
        : null,
    ]);

    return {
      ...finalStudent,
      user,
      school,
      class: classData,
    };
  });
};

/**
 * Cập nhật user info của student
 */
const updateStudentUser = async (id, userData) => {
  const { user_name, full_name, email, phone_number, address } = userData;

  // Get student info
  const student = await prisma.auth_impl_user_student.findUnique({
    where: { id },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  if (!student.user_id) {
    throw new Error("Student has no associated user account");
  }

  // Check username duplicate
  if (user_name) {
    const existingUser = await prisma.auth_base_user.findFirst({
      where: {
        user_name,
        NOT: { id: student.user_id },
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
        NOT: { id: student.user_id },
      },
    });
    if (existingEmail) {
      throw new Error("Email already exists");
    }
  }

  // Update user
  const user = await prisma.auth_base_user.update({
    where: { id: student.user_id },
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
 * Xóa student (có thể giữ lại user account)
 */
const deleteStudent = async (id, options = {}) => {
  const { deleteUser = false } = options;

  return await prisma.$transaction(async (tx) => {
    // Get student info
    const student = await tx.auth_impl_user_student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Delete student record
    await tx.auth_impl_user_student.delete({
      where: { id },
    });

    // Optionally delete user account
    if (deleteUser && student.user_id) {
      // Check if user is used in other places
      const [userSchool, refreshTokens] = await Promise.all([
        tx.auth_impl_user_school.findFirst({
          where: { user_id: student.user_id },
        }),
        tx.auth_refresh_tokens.findFirst({
          where: { user_id: student.user_id },
        }),
      ]);

      if (!userSchool && !refreshTokens) {
        await tx.auth_base_user.delete({
          where: { id: student.user_id },
        });
      }
    }

    return {
      message: deleteUser
        ? "Delete student and user account successfully"
        : "Delete student successfully",
    };
  });
};

/**
 * Import danh sách students từ file Excel
 */
const importStudents = async (fileBuffer, class_id) => {
  try {
    // Validate class exists
    const classData = await prisma.classes.findUnique({
      where: { id: class_id },
      select: { id: true, name: true, school_id: true },
    });

    if (!classData) {
      throw new Error("Class not found");
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
        "Nhóm người dùng",
        "Mật khẩu",
        "Giới tính",
        "Ngày sinh",
        "Mô tả",
        "Ngành yêu thích",
      ],
      defval: "",
      raw: false, // Chuyển date thành string thay vì số
      dateNF: "dd/mm/yyyy", // Format ngày tháng
    });

    if (!jsonData || jsonData.length === 0) {
      throw new Error("File không có dữ liệu");
    }

    // Lấy student group
    const studentGroup = await getDefaultStudentGroupId();

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
        // Map các cột theo file Excel mới
        const user_name = row["Tên đăng nhập"]?.toString().trim();
        const full_name = row["Họ và tên"]?.toString().trim();
        let email = row["Email"]?.toString().trim();
        let phone_number = row["Số điện thoại"]?.toString().trim();
        const address = row["Địa chỉ"]?.toString().trim();
        const password = row["Mật khẩu"]?.toString().trim();
        const sexRaw = row["Giới tính"]?.toString().trim().toUpperCase();
        const birthdayRaw = row["Ngày sinh"]?.toString().trim();
        const description = row["Mô tả"]?.toString().trim();
        const major_interest = row["Ngành yêu thích"]?.toString().trim();

        // Validate required fields
        if (!user_name || !full_name) {
          errorMessage = "Thiếu tên đăng nhập hoặc họ tên";
          throw new Error(errorMessage);
        }

        // Tự động cắt bớt nếu quá dài (thay vì báo lỗi)
        if (phone_number && phone_number.length > 15) {
          phone_number = phone_number.substring(0, 15);
        }
        if (email && email.length > 255) {
          email = email.substring(0, 255);
        }

        // Dùng school_id từ lớp
        const school_id = classData.school_id;

        // Map sex
        const sexMap = {
          NAM: "MALE",
          NỮ: "FEMALE",
          MALE: "MALE",
          FEMALE: "FEMALE",
        };
        const sex = sexRaw ? sexMap[sexRaw] || null : null;

        // Parse birthday
        let birthday = null;
        if (birthdayRaw) {
          console.log(
            `Row ${rowNumber}: birthdayRaw = "${birthdayRaw}", type = ${typeof birthdayRaw}`
          );

          // Nếu là số (Excel serial date), convert sang Date
          if (typeof birthdayRaw === "number") {
            // Excel date serial number (số ngày từ 1/1/1900)
            const excelEpoch = new Date(1899, 11, 30); // 30/12/1899
            birthday = new Date(
              excelEpoch.getTime() + birthdayRaw * 24 * 60 * 60 * 1000
            );
          } else if (typeof birthdayRaw === "string") {
            const trimmed = birthdayRaw.trim();

            // Try DD/MM/YYYY format
            const ddmmyyyyMatch = trimmed.match(
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
            );
            if (ddmmyyyyMatch) {
              const [, day, month, year] = ddmmyyyyMatch;
              birthday = new Date(
                `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
              );
            }
            // Try YYYY-MM-DD format
            else if (trimmed.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
              birthday = new Date(trimmed);
            }
            // Try native Date parsing as fallback
            else {
              birthday = new Date(trimmed);
            }
          }

          if (!birthday || isNaN(birthday.getTime())) {
            errorMessage = `Định dạng ngày sinh không hợp lệ: "${birthdayRaw}" (Chấp nhận: DD/MM/YYYY hoặc YYYY-MM-DD)`;
            throw new Error(errorMessage);
          }
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

        // Tạo user và student trong transaction
        const result = await prisma.$transaction(async (tx) => {
          // Generate student code từ tên lớp (dùng classData từ param)
          const student_code = await generateStudentCode(classData.name);

          // 1. Tạo user
          const user = await tx.auth_base_user.create({
            data: {
              user_name,
              full_name,
              email: email || null,
              phone_number: phone_number || null,
              address: address || null,
              password_hash: await bcrypt.hashPassword(
                password || "123456",
                10
              ),
              group_id: studentGroup,
              status: "ACTIVE",
            },
          });

          // 2. Tạo student
          const student = await tx.auth_impl_user_student.create({
            data: {
              user_id: user.id,
              school_id,
              class_id: class_id, // Dùng class_id từ param
              student_code,
              sex,
              birthday,
              description: description || null,
              major_interest: major_interest || null,
            },
            select: {
              id: true,
              user_id: true,
              school_id: true,
              class_id: true,
              student_code: true,
            },
          });

          return { user, student };
        });

        results.success.push({
          row: rowNumber,
          student: result.student,
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
          STT: rowNumber - 1,
          "Tên đăng nhập": row["Tên đăng nhập"] || "",
          "Họ và tên": row["Họ và tên"] || "",
          Email: row["Email"] || "",
          "Số điện thoại": row["Số điện thoại"] || "",
          "Địa chỉ": row["Địa chỉ"] || "",
          "Nhóm người dùng": row["Nhóm người dùng"] || "",
          "Mật khẩu": row["Mật khẩu"] || "",
          "Giới tính": row["Giới tính"] || "",
          "Ngày sinh": row["Ngày sinh"] || "",
          "Mô tả": row["Mô tả"] || "",
          "Ngành yêu thích": row["Ngành yêu thích"] || "",
          Lỗi: errorMessage || error.message,
        });
        errorRows.push(errorData.length);
      }
    }

    // Nếu có lỗi, tạo file Excel với các row bị lỗi
    let errorFileBuffer = null;
    if (errorData.length > 0) {
      const errorWorksheet = xlsx.utils.json_to_sheet(errorData);

      // Thêm style cho header
      const headerRange = xlsx.utils.decode_range(errorWorksheet["!ref"]);
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
            errorWorksheet[cellAddress] = { t: "s", v: "" };
          }

          errorWorksheet[cellAddress].s = {
            fill: { fgColor: { rgb: "FF0000" } },
            font: { color: { rgb: "FFFFFF" } },
          };
        }
      });

      // Set column widths
      errorWorksheet["!cols"] = [
        { wch: 5 }, // STT
        { wch: 15 }, // Tên đăng nhập
        { wch: 20 }, // Họ và tên
        { wch: 25 }, // Email
        { wch: 15 }, // Số điện thoại
        { wch: 30 }, // Địa chỉ
        { wch: 20 }, // Nhóm người dùng
        { wch: 15 }, // Mật khẩu
        { wch: 10 }, // Giới tính
        { wch: 15 }, // Ngày sinh
        { wch: 20 }, // Mô tả
        { wch: 25 }, // Ngành yêu thích
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
  getAllStudents,
  getStudentById,
  getStudentByUserId,
  createStudent,
  updateStudent,
  updateStudentUser,
  deleteStudent,
  importStudents,
};
