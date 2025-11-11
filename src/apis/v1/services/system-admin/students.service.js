const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("../../../../utils/bcrypt");

/**
 * Lấy default student group ID
 */
const getDefaultStudentGroupId = async () => {
  const studentGroup = await prisma.auth_group.findFirst({
    where: { 
      OR: [
        { type: "STUDENT" },
        { name: { contains: "Student" } },
        { name: { contains: "Học sinh" } }
      ]
    },
  });
  
  return studentGroup?.id || null;
};

/**
 * Lấy danh sách students với phân trang và tìm kiếm
 */
const getAllStudents = async ({ filters = {}, paging = {}, orderBy = {} }) => {
  const { skip = 0, limit = 10 } = paging;

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
    const userIds = [...new Set(data.map(student => student.user_id).filter(Boolean))];
    const schoolIds = [...new Set(data.map(student => student.school_id).filter(Boolean))];
    const classIds = [...new Set(data.map(student => student.class_id).filter(Boolean))];
    
    // Parallel queries
    const [users, schools, classes] = await Promise.all([
      userIds.length > 0 ? prisma.auth_base_user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          user_name: true,
          full_name: true,
          email: true,
          phone_number: true,
          status: true,
        },
      }) : [],
      schoolIds.length > 0 ? prisma.schools.findMany({
        where: { id: { in: schoolIds } },
        select: { id: true, name: true },
      }) : [],
      classIds.length > 0 ? prisma.classes.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true, grade_level: true },
      }) : [],
    ]);

    // Create maps for fast lookup
    const usersMap = Object.fromEntries(users.map(user => [user.id, user]));
    const schoolsMap = Object.fromEntries(schools.map(school => [school.id, school]));
    const classesMap = Object.fromEntries(classes.map(cls => [cls.id, cls]));

    // Attach related data
    data.forEach(student => {
      student.user = student.user_id ? usersMap[student.user_id] || null : null;
      student.school = student.school_id ? schoolsMap[student.school_id] || null : null;
      student.class = student.class_id ? classesMap[student.class_id] || null : null;
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
    student.user_id ? prisma.auth_base_user.findUnique({
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
    }) : null,
    student.school_id ? prisma.schools.findUnique({
      where: { id: student.school_id },
      select: { id: true, name: true },
    }) : null,
    student.class_id ? prisma.classes.findUnique({
      where: { id: student.class_id },
      select: { id: true, name: true, grade_level: true },
    }) : null,
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

    // 1. Create user account first
    const user = await tx.auth_base_user.create({
      data: {
        user_name,
        full_name,
        email,
        phone_number,
        password_hash: password ? await bcrypt.hashPassword(password) : await bcrypt.hashPassword('student123'),
        address,
        group_id: studentGroupId,
        status: 'ACTIVE',
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
      school_id ? tx.schools.findUnique({
        where: { id: school_id },
        select: { id: true, name: true },
      }) : null,
      class_id ? tx.classes.findUnique({
        where: { id: class_id },
        select: { id: true, name: true, grade_level: true },
      }) : null,
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
const updateStudent = async (id, studentData) => {
  const {
    school_id,
    class_id,
    sex,
    birthday,
    description,
    major_interest,
  } = studentData;

  // Check student exists
  const existingStudent = await prisma.auth_impl_user_student.findUnique({
    where: { id },
  });

  if (!existingStudent) {
    throw new Error("Student not found");
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

  // Validate class exists
  if (class_id) {
    const classData = await prisma.classes.findUnique({
      where: { id: class_id },
    });
    if (!classData) {
      throw new Error("Class not found");
    }
  }

  const student = await prisma.auth_impl_user_student.update({
    where: { id },
    data: {
      school_id,
      class_id,
      sex,
      birthday: birthday ? new Date(birthday) : undefined,
      description,
      major_interest,
    },
    select: {
      id: true,
      user_id: true,
      school_id: true,
      class_id: true,
      sex: true,
      birthday: true,
      description: true,
      major_interest: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Get related data
  const [user, school, classData] = await Promise.all([
    student.user_id ? prisma.auth_base_user.findUnique({
      where: { id: student.user_id },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        phone_number: true,
        status: true,
      },
    }) : null,
    student.school_id ? prisma.schools.findUnique({
      where: { id: student.school_id },
      select: { id: true, name: true },
    }) : null,
    student.class_id ? prisma.classes.findUnique({
      where: { id: student.class_id },
      select: { id: true, name: true, grade_level: true },
    }) : null,
  ]);

  student.user = user;
  student.school = school;
  student.class = classData;

  return student;
};

/**
 * Cập nhật user info của student
 */
const updateStudentUser = async (id, userData) => {
  const {
    user_name,
    full_name,
    email,
    phone_number,
    address,
  } = userData;

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

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  updateStudentUser,
  deleteStudent,
};