const schoolUserService = require("../../apis/v1/services/system-admin/schoolUsers.service");
const userService = require("../../apis/v1/services/system-admin/users.service");
const checkSchool = async (req, res, next) => {
  const { userSession } = req;

  const user = await userService.getUserByUsername(userSession.user_name);

  if (!user) {
    return res.status(403).json({
      success: false,
      message: "User not found",
    });
  }

  const schoolUser = await schoolUserService.checkUserSchoolAssociation(
    user.id
  );

  if (!schoolUser || schoolUser.length === 0) {
    return res.status(403).json({
      success: false,
      message: "User is not associated with any school",
    });
  }

  req.schoolUser = schoolUser;

  return next();
};

module.exports = checkSchool;
