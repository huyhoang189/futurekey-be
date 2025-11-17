const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy danh sách classes với phân trang và tìm kiếm
 */
const getAllClasses = async ({ filters = {}, paging = {}, orderBy = {} }) => {
  const { skip = 0, limit = 10 } = paging;

  // Đếm tổng số records
  const total = await prisma.classes.count({
    where: filters,
  });

  // Lấy dữ liệu với phân trang
  const data = await prisma.classes.findMany({
    where: filters,
    skip: skip,
    take: limit,
    orderBy: orderBy,
    select: {
      id: true,
      name: true,
      grade_level: true,
      school_id: true,
      homeroom_teacher_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Manual join với schools và homeroom teachers
  if (data.length > 0) {
    // Lấy unique school_ids và homeroom_teacher_ids
    const schoolIds = [...new Set(data.map(cls => cls.school_id).filter(Boolean))];
    const teacherIds = [...new Set(data.map(cls => cls.homeroom_teacher_id).filter(Boolean))];
    
    // Parallel queries
    const [schools, schoolUsers] = await Promise.all([
      schoolIds.length > 0 ? prisma.schools.findMany({
        where: { id: { in: schoolIds } },
        select: {
          id: true,
          name: true,
        },
      }) : [],
      teacherIds.length > 0 ? prisma.auth_impl_user_school.findMany({
        where: { user_id: { in: teacherIds } },
        select: {
          id: true,
          user_id: true,
          school_id: true,
          description: true,
        },
      }) : [],
    ]);

    // Lấy thông tin users cho teachers
    const userIds = schoolUsers.map(su => su.user_id).filter(Boolean);
    const users = userIds.length > 0 ? await prisma.auth_base_user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        phone_number: true,
      },
    }) : [];

    // Tạo maps để lookup nhanh
    const schoolsMap = Object.fromEntries(schools.map(school => [school.id, school]));
    const usersMap = Object.fromEntries(users.map(user => [user.id, user]));
    const schoolUsersMap = Object.fromEntries(
      schoolUsers.map(su => [
        su.user_id,
        { ...su, user: usersMap[su.user_id] || null }
      ])
    );

    // Gắn thông tin school và homeroom_teacher vào từng class
    data.forEach(cls => {
      cls.school = cls.school_id ? schoolsMap[cls.school_id] || null : null;
      cls.homeroom_teacher = cls.homeroom_teacher_id ? schoolUsersMap[cls.homeroom_teacher_id] || null : null;
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
 * Lấy thông tin class theo ID
 */
const getClassById = async (id) => {
  const classData = await prisma.classes.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      grade_level: true,
      school_id: true,
      homeroom_teacher_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!classData) {
    throw new Error("Class not found");
  }

  // Manual join với school và homeroom teacher
  const [school, schoolUser] = await Promise.all([
    classData.school_id ? prisma.schools.findUnique({
      where: { id: classData.school_id },
      select: {
        id: true,
        name: true,
      },
    }) : null,
    classData.homeroom_teacher_id ? prisma.auth_impl_user_school.findFirst({
      where: { user_id: classData.homeroom_teacher_id },
      select: {
        id: true,
        user_id: true,
        school_id: true,
        description: true,
      },
    }) : null,
  ]);

  // Lấy thông tin user của teacher
  if (schoolUser && schoolUser.user_id) {
    const user = await prisma.auth_base_user.findUnique({
      where: { id: schoolUser.user_id },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        phone_number: true,
      },
    });
    schoolUser.user = user;
  }

  classData.school = school;
  classData.homeroom_teacher = schoolUser;

  return classData;
};

/**
 * Tạo mới class
 */
const createClass = async (classData) => {
  const { name, grade_level, school_id, homeroom_teacher_id } = classData;

  // Kiểm tra school có tồn tại không (nếu có school_id)
  if (school_id) {
    const existingSchool = await prisma.schools.findUnique({
      where: { id: school_id },
    });

    if (!existingSchool) {
      throw new Error("School not found");
    }
  }

  // Kiểm tra homeroom teacher có tồn tại không (nếu có homeroom_teacher_id)
  if (homeroom_teacher_id) {
    const existingTeacher = await prisma.auth_base_user.findUnique({
      where: { id: homeroom_teacher_id },
    });

    if (!existingTeacher) {
      throw new Error("Homeroom teacher not found");
    }
  }

  // Kiểm tra tên class đã tồn tại trong cùng trường chưa
  if (name && school_id) {
    const existingClass = await prisma.classes.findFirst({
      where: { 
        name,
        school_id,
      },
    });

    if (existingClass) {
      throw new Error("Class name already exists in this school");
    }
  }

  const classResult = await prisma.classes.create({
    data: {
      name,
      grade_level,
      school_id,
      homeroom_teacher_id,
    },
    select: {
      id: true,
      name: true,
      grade_level: true,
      school_id: true,
      homeroom_teacher_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Manual join với school và homeroom teacher
  const [school, schoolUser] = await Promise.all([
    classResult.school_id ? prisma.schools.findUnique({
      where: { id: classResult.school_id },
      select: {
        id: true,
        name: true,
      },
    }) : null,
    classResult.homeroom_teacher_id ? prisma.auth_impl_user_school.findFirst({
      where: { user_id: classResult.homeroom_teacher_id },
      select: {
        id: true,
        user_id: true,
        school_id: true,
        description: true,
      },
    }) : null,
  ]);

  // Lấy thông tin user của teacher
  if (schoolUser && schoolUser.user_id) {
    const user = await prisma.auth_base_user.findUnique({
      where: { id: schoolUser.user_id },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        phone_number: true,
      },
    });
    schoolUser.user = user;
  }

  classResult.school = school;
  classResult.homeroom_teacher = schoolUser;

  return classResult;
};

/**
 * Cập nhật class
 */
const updateClass = async (id, classData) => {
  const { name, grade_level, school_id, homeroom_teacher_id } = classData;

  // Kiểm tra class có tồn tại không
  const existingClass = await prisma.classes.findUnique({
    where: { id },
  });

  if (!existingClass) {
    throw new Error("Class not found");
  }

  // Kiểm tra school có tồn tại không (nếu có school_id)
  if (school_id) {
    const existingSchool = await prisma.schools.findUnique({
      where: { id: school_id },
    });

    if (!existingSchool) {
      throw new Error("School not found");
    }
  }

  // Kiểm tra homeroom teacher có tồn tại không (nếu có homeroom_teacher_id)
  if (homeroom_teacher_id) {
    const existingTeacher = await prisma.auth_base_user.findUnique({
      where: { id: homeroom_teacher_id },
    });

    if (!existingTeacher) {
      throw new Error("Homeroom teacher not found");
    }
  }

  // Kiểm tra tên class đã tồn tại trong cùng trường chưa (ngoại trừ chính nó)
  if (name && school_id && (name !== existingClass.name || school_id !== existingClass.school_id)) {
    const duplicateClass = await prisma.classes.findFirst({
      where: {
        name,
        school_id,
        NOT: { id },
      },
    });

    if (duplicateClass) {
      throw new Error("Class name already exists in this school");
    }
  }

  const classResult = await prisma.classes.update({
    where: { id },
    data: {
      name,
      grade_level,
      school_id,
      homeroom_teacher_id,
    },
    select: {
      id: true,
      name: true,
      grade_level: true,
      school_id: true,
      homeroom_teacher_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Manual join với school và homeroom teacher
  const [school, schoolUser] = await Promise.all([
    classResult.school_id ? prisma.schools.findUnique({
      where: { id: classResult.school_id },
      select: {
        id: true,
        name: true,
      },
    }) : null,
    classResult.homeroom_teacher_id ? prisma.auth_impl_user_school.findFirst({
      where: { user_id: classResult.homeroom_teacher_id },
      select: {
        id: true,
        user_id: true,
        school_id: true,
        description: true,
      },
    }) : null,
  ]);

  // Lấy thông tin user của teacher
  if (schoolUser && schoolUser.user_id) {
    const user = await prisma.auth_base_user.findUnique({
      where: { id: schoolUser.user_id },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        phone_number: true,
      },
    });
    schoolUser.user = user;
  }

  classResult.school = school;
  classResult.homeroom_teacher = schoolUser;

  return classResult;
};

/**
 * Xóa class
 */
const deleteClass = async (id) => {
  // Kiểm tra class có tồn tại không
  const existingClass = await prisma.classes.findUnique({
    where: { id },
  });

  if (!existingClass) {
    throw new Error("Class not found");
  }

  // Kiểm tra có student nào đang thuộc class này không
  const studentsInClass = await prisma.auth_impl_user_student.findFirst({
    where: { class_id: id },
  });

  if (studentsInClass) {
    throw new Error("Cannot delete class. There are students associated with this class");
  }

  await prisma.classes.delete({
    where: { id },
  });

  return {
    message: "Delete class successfully",
  };
};

/**
 * Lấy danh sách students của class
 */
const getClassStudents = async (classId, paging = {}) => {
  const { skip = 0, limit = 10 } = paging;

  // Kiểm tra class có tồn tại không
  const classData = await prisma.classes.findUnique({
    where: { id: classId },
  });

  if (!classData) {
    throw new Error("Class not found");
  }

  // Đếm tổng số students
  const total = await prisma.auth_impl_user_student.count({
    where: { class_id: classId },
  });

  // Lấy danh sách students
  const data = await prisma.auth_impl_user_student.findMany({
    where: { class_id: classId },
    skip: skip,
    take: limit,
    orderBy: { created_at: "desc" },
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

  return {
    data,
    meta: {
      total,
      skip,
      limit,
    },
  };
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
};