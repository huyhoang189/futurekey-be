const studentService = require("../../apis/v1/services/system-admin/students.service");
const userService = require("../../apis/v1/services/system-admin/users.service");
const checkStudent = async (req, res, next) => {
  const { userSession } = req;

  const user = await userService.getUserByUsername(userSession.user_name);

  if (!user) {
    return res.status(403).json({
      success: false,
      message: "User not found",
    });
  }

  if (user?.group?.type !== "SCHOOL_STUDENT") {
    return res.status(403).json({
      success: false,
      message: "Access denied. User is not a student",
    });
  }

  const student = await studentService.getStudentByUserId(user.id);

  if (!student || student.length === 0) {
    return res.status(403).json({
      success: false,
      message: "User is not associated with any school",
    });
  }

  req.student = student;

  return next();
};

module.exports = checkStudent;
