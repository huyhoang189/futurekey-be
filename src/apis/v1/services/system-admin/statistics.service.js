const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy thống kê tổng quan cho trường
 */
const getSchoolOverview = async (school_id) => {
  // Build where condition
  const whereCondition = school_id ? { school_id } : {};

  // Đếm số giáo viên
  const teacher_count = await prisma.auth_impl_user_school.count({
    where: whereCondition,
  });

  // Đếm số học sinh
  const student_count = await prisma.auth_impl_user_student.count({
    where: whereCondition,
  });

  // Đếm số lớp
  const class_count = await prisma.classes.count({
    where: whereCondition,
  });

  // Career count - tạm thời set 0
  const career_count = 0;

  return {
    teacher_count,
    student_count,
    class_count,
    career_count,
  };
};

/**
 * Thống kê học sinh theo khối (grade level)
 */
const getStudentsByLevel = async (school_id) => {
  // Build where condition
  const whereCondition = school_id ? { school_id } : {};

  // Lấy tất cả lớp của trường với grade_level
  const classes = await prisma.classes.findMany({
    where: whereCondition,
    select: {
      id: true,
      grade_level: true,
    },
  });

  // Tạo map class_id -> grade_level
  const classGradeMap = {};
  classes.forEach(cls => {
    classGradeMap[cls.id] = cls.grade_level;
  });

  const classIds = classes.map(cls => cls.id);

  // Lấy tất cả học sinh thuộc các lớp này
  const studentWhere = {
    class_id: { in: classIds },
  };
  if (school_id) {
    studentWhere.school_id = school_id;
  }

  const students = await prisma.auth_impl_user_student.findMany({
    where: studentWhere,
    select: {
      class_id: true,
    },
  });

  // Thống kê theo grade_level
  const levelStats = {};
  
  students.forEach(student => {
    const gradeLevel = classGradeMap[student.class_id];
    if (gradeLevel) {
      if (!levelStats[gradeLevel]) {
        levelStats[gradeLevel] = 0;
      }
      levelStats[gradeLevel]++;
    }
  });

  // Chuyển thành array và sắp xếp theo grade_level
  const result = Object.entries(levelStats)
    .map(([grade_level, student_count]) => ({
      grade_level: parseInt(grade_level),
      student_count,
    }))
    .sort((a, b) => a.grade_level - b.grade_level);

  return result;
};

module.exports = {
  getSchoolOverview,
  getStudentsByLevel,
};
