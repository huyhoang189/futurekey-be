const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const userService = require("../../apis/v1/services/system-admin/users.service");

const checkAdminRole = async (req, res, next) => {
  const { userSession } = req;
  const user = await userService.getUserByUsername(userSession?.user_name);

  const type = user?.group?.type;
  if (type !== "SUPER_ADMIN" && type !== "ADMIN") {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "Bạn không có quyền truy cập vào đây!",
    });
  }

  return next();
};

module.exports = checkAdminRole;
