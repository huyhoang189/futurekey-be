const { StatusCodes } = require("http-status-codes");
const authService = require("../../services/system-admin/auth.service");
const userService = require("../../services/system-admin/users.service");
/**
 * Đăng nhập
 * POST /api/v1/system-admin/auth/login
 */
const login = async (req, res) => {
  try {
    const { user_name, password } = req.body;

    // Validate required fields
    if (!user_name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Username is required",
      });
    }

    if (!password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Password is required",
      });
    }

    // Lấy IP address và User agent từ request
    const ip_address =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    const user_agent = req.headers["user-agent"] || "Unknown";

    const result = await authService.login({
      user_name,
      password,
      ip_address,
      user_agent,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successfully",
      data: result,
    });
  } catch (error) {
    // Xác định status code dựa trên error message
    let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

    if (
      error.message.includes("Invalid username") ||
      error.message.includes("Invalid password") ||
      error.message.includes("not active")
    ) {
      statusCode = StatusCodes.UNAUTHORIZED;
    } else if (
      error.message.includes("locked") ||
      error.message.includes("Too many login attempts")
    ) {
      statusCode = StatusCodes.FORBIDDEN;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Làm mới token
 * POST /api/v1/system-admin/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    // Validate required fields
    if (!refresh_token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Lấy IP address và User agent từ request
    const ip_address =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    const user_agent = req.headers["user-agent"] || "Unknown";

    const result = await authService.refreshToken({
      refresh_token,
      ip_address,
      user_agent,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Refresh token successfully",
      data: result,
    });
  } catch (error) {
    // Xác định status code dựa trên error message
    let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

    if (
      error.message.includes("không hợp lệ") ||
      error.message.includes("hết hạn") ||
      error.message.includes("không còn active")
    ) {
      statusCode = StatusCodes.UNAUTHORIZED;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Đăng xuất
 * POST /api/v1/system-admin/auth/logout
 */
const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    // Validate required fields
    if (!refresh_token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await authService.logout({ refresh_token });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    // Xác định status code dựa trên error message
    let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

    if (error.message.includes("không hợp lệ")) {
      statusCode = StatusCodes.UNAUTHORIZED;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lấy thông tin user hiện tại đang đăng nhập
 * GET /api/v1/auth/me
 */

const getMe = async (req, res) => {
  try {
    const user_name = req.userSession?.user_name;
    const user = await userService.getUserByUsername(user_name, {
      user_name: true,
      full_name: true,
      email: true,
      phone_number: true,
      address: true,
      description: true,
      group_id: true,
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Người dùng không tồn tại",
      });
    }

    return res.status(StatusCodes.OK).json({
      data: user,
      message: "Lấy thông tin người dùng thành công",
    });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Lỗi khi lấy thông tin người dùng: " + error.message,
    });
  }
};

/**
 * Change a user's password (self-service or by an admin-type user).
 */
const changePassword = async (req, res) => {
  try {
    const { id, password } = req.body;
    const requesterName = req.userSession?.user_name;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Password is required",
      });
    }

    const requester = await userService.getUserByUsername(requesterName);
    const requesterId = requester.id;

    if (requesterId !== id) {
      const allowedTypes = [
        "SUPER_ADMIN",
        "ADMIN",
        "SCHOOL_ADMIN",
        "SCHOOL_TEACHER",
      ];

      if (!requester.group || !allowedTypes.includes(requester.group.type)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Insufficient permissions to change another user's password",
        });
      }
    }

    const result = await userService.changePassword(id, password);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
};
