const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy danh sách schools với phân trang và tìm kiếm
 */
const getAllSchools = async ({ filters = {}, paging = {}, orderBy = {} }) => {
  const { skip = 0, limit = 10 } = paging;

  // Đếm tổng số records
  const total = await prisma.schools.count({
    where: filters,
  });

  // Lấy dữ liệu với phân trang
  const data = await prisma.schools.findMany({
    where: filters,
    skip: skip,
    take: limit,
    orderBy: orderBy,
    select: {
      id: true,
      name: true,
      address: true,
      contact_email: true,
      phone_number: true,
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

/**
 * Lấy thông tin school theo ID
 */
const getSchoolById = async (id) => {
  const school = await prisma.schools.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      address: true,
      contact_email: true,
      phone_number: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!school) {
    throw new Error("School not found");
  }

  return school;
};

/**
 * Tạo mới school
 */
const createSchool = async (schoolData) => {
  const { name, address, contact_email, phone_number } = schoolData;

  // Kiểm tra tên school đã tồn tại chưa
  if (name) {
    const existingSchool = await prisma.schools.findFirst({
      where: { name },
    });

    if (existingSchool) {
      throw new Error("School name already exists");
    }
  }

  // Kiểm tra email đã tồn tại chưa
  if (contact_email) {
    const existingEmail = await prisma.schools.findFirst({
      where: { contact_email },
    });

    if (existingEmail) {
      throw new Error("Contact email already exists");
    }
  }

  const school = await prisma.schools.create({
    data: {
      name,
      address,
      contact_email,
      phone_number,
    },
    select: {
      id: true,
      name: true,
      address: true,
      contact_email: true,
      phone_number: true,
      created_at: true,
      updated_at: true,
    },
  });

  return school;
};

/**
 * Cập nhật school
 */
const updateSchool = async (id, schoolData) => {
  const { name, address, contact_email, phone_number } = schoolData;

  // Kiểm tra school có tồn tại không
  const existingSchool = await prisma.schools.findUnique({
    where: { id },
  });

  if (!existingSchool) {
    throw new Error("School not found");
  }

  // Kiểm tra tên school đã tồn tại chưa (ngoại trừ chính nó)
  if (name && name !== existingSchool.name) {
    const duplicateName = await prisma.schools.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicateName) {
      throw new Error("School name already exists");
    }
  }

  // Kiểm tra email đã tồn tại chưa (ngoại trừ chính nó)
  if (contact_email && contact_email !== existingSchool.contact_email) {
    const duplicateEmail = await prisma.schools.findFirst({
      where: {
        contact_email,
        NOT: { id },
      },
    });

    if (duplicateEmail) {
      throw new Error("Contact email already exists");
    }
  }

  const school = await prisma.schools.update({
    where: { id },
    data: {
      name,
      address,
      contact_email,
      phone_number,
    },
    select: {
      id: true,
      name: true,
      address: true,
      contact_email: true,
      phone_number: true,
      created_at: true,
      updated_at: true,
    },
  });

  return school;
};

/**
 * Xóa school
 */
const deleteSchool = async (id) => {
  // Kiểm tra school có tồn tại không
  const existingSchool = await prisma.schools.findUnique({
    where: { id },
  });

  if (!existingSchool) {
    throw new Error("School not found");
  }

  // Kiểm tra có user nào đang thuộc school này không
  const usersInSchool = await prisma.auth_impl_user_school.findFirst({
    where: { school_id: id },
  });

  if (usersInSchool) {
    throw new Error("Cannot delete school. There are users associated with this school");
  }

  // Kiểm tra có student nào đang thuộc school này không
  const studentsInSchool = await prisma.auth_impl_user_student.findFirst({
    where: { school_id: id },
  });

  if (studentsInSchool) {
    throw new Error("Cannot delete school. There are students associated with this school");
  }

  // Kiểm tra có class nào đang thuộc school này không
  const classesInSchool = await prisma.classes.findFirst({
    where: { school_id: id },
  });

  if (classesInSchool) {
    throw new Error("Cannot delete school. There are classes associated with this school");
  }

  await prisma.schools.delete({
    where: { id },
  });

  return {
    message: "Delete school successfully",
  };
};

/**
 * Lấy danh sách classes của school
 */
const getSchoolClasses = async (schoolId, paging = {}) => {
  const { skip = 0, limit = 10 } = paging;

  // Kiểm tra school có tồn tại không
  const school = await prisma.schools.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw new Error("School not found");
  }

  // Đếm tổng số classes
  const total = await prisma.classes.count({
    where: { school_id: schoolId },
  });

  // Lấy danh sách classes
  const data = await prisma.classes.findMany({
    where: { school_id: schoolId },
    skip: skip,
    take: limit,
    orderBy: { created_at: "desc" },
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
 * Lấy danh sách students của school
 */
const getSchoolStudents = async (schoolId, paging = {}) => {
  const { skip = 0, limit = 10 } = paging;

  // Kiểm tra school có tồn tại không
  const school = await prisma.schools.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw new Error("School not found");
  }

  // Đếm tổng số students
  const total = await prisma.auth_impl_user_student.count({
    where: { school_id: schoolId },
  });

  // Lấy danh sách students
  const data = await prisma.auth_impl_user_student.findMany({
    where: { school_id: schoolId },
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
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolClasses,
  getSchoolStudents,
};