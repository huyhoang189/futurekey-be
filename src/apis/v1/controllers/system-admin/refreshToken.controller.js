const { StatusCodes } = require("http-status-codes");
const refreshTokenService = require("../../services/system-admin/refreshToken.service");

/**
 * Lấy danh sách refresh tokens
 * GET /api/v1/system-admin/refresh-tokens?page=1&limit=10
 */
const getAllRefreshTokens = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { user_id, revoked, expired } = req.query;

    // Build filters
    const filters = {};

    if (revoked !== undefined && revoked !== "TOTAL_ITEM") {
      if (revoked === "true" || revoked === true) {
        filters.revoked_at = { not: null }; // Đã revoke
      } else if (revoked === "false" || revoked === false) {
        filters.revoked_at = null; // Chưa revoke
      }
    }

    if (expired !== undefined && expired !== "TOTAL_ITEM") {
      if (expired === "true" || expired === true) {
        filters.expires_at = { lt: new Date() }; // Đã hết hạn
      } else if (expired === "false" || expired === false) {
        filters.expires_at = { gte: new Date() }; // Còn hạn
      }
    }

    const result = await refreshTokenService.getAllRefreshTokens({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all refresh tokens successfully",
      data: result.data,
      meta: {
        ...result.meta,
        page,
      },
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thu hồi (revoke) một refresh token
 * PUT /api/v1/system-admin/refresh-tokens/:id/revoke
 */
const revokeRefreshToken = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Token ID is required",
      });
    }

    const token = await refreshTokenService.revokeRefreshToken(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Token revoked successfully",
      data: token,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xóa vĩnh viễn refresh token
 * DELETE /api/v1/system-admin/refresh-tokens/:id
 */
const deleteRefreshToken = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Token ID is required",
      });
    }

    const result = await refreshTokenService.deleteRefreshToken(id);

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
  getAllRefreshTokens,
  revokeRefreshToken,
  deleteRefreshToken,
};
