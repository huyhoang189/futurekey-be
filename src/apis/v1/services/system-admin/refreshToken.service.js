const prisma = require("../../../../configs/prisma");
const { buildWhereClause } = require("../../../../utils/func");
const { FR } = require("../../../../common");

const CURRENT_FR = FR.FR00002 || "FR00002";

/**
 * Lấy danh sách refresh tokens với phân trang và lọc
 * @param {Object} params - Parameters
 * @param {Object} params.filters - Điều kiện lọc
 * @param {Object} params.paging - Thông tin phân trang {skip, limit}
 * @param {Object} params.orderBy - Sắp xếp
 * @param {Object} params.select - Các trường cần select
 * @returns {Object} - {data: [], meta: {total, skip, limit}}
 */
const getAllRefreshTokens = async ({
  filters = {},
  paging = { skip: 0, limit: 10 },
  orderBy = { created_at: "desc" },
  select = null,
}) => {
  try {
    const where = buildWhereClause(filters);

    const [records, total] = await Promise.all([
      prisma.auth_refresh_tokens.findMany({
        where,
        skip: paging.skip,
        take: paging.limit,
        orderBy,
        ...(select && { select }),
      }),
      prisma.auth_refresh_tokens.count({ where }),
    ]);

    // Lấy danh sách user_id unique
    const userIds = [...new Set(records.map((r) => r.user_id).filter(Boolean))];

    // Lấy thông tin users
    const users = await prisma.auth_base_user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        user_name: true,
        full_name: true,
        email: true,
        status: true,
      },
    });

    // Tạo map để tra cứu nhanh
    const userMap = {};
    users.forEach((user) => {
      userMap[user.id] = user;
    });

    // Gắn thông tin user vào từng token
    const dataWithUser = records.map((token) => ({
      ...token,
      user: userMap[token.user_id] || null,
    }));

    return {
      data: dataWithUser,
      meta: {
        total,
        ...paging,
      },
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Lấy refresh token theo ID
 * @param {String} id - Token ID
 * @param {Object} select - Các trường cần select
 * @returns {Object|null} - Token object hoặc null
 */
const getRefreshTokenById = async (id, select = null) => {
  try {
    const token = await prisma.auth_refresh_tokens.findUnique({
      where: { id },
      ...(select && { select }),
    });

    if (!token) {
      throw new Error("Refresh token not found");
    }

    return token;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Lấy refresh token theo token_id
 * @param {String} token_id - Token ID string
 * @param {Object} select - Các trường cần select
 * @returns {Object|null} - Token object hoặc null
 */
const getRefreshTokenByTokenId = async (token_id, select = null) => {
  try {
    const token = await prisma.auth_refresh_tokens.findFirst({
      where: { token_id },
      ...(select && { select }),
    });

    if (!token) {
      throw new Error("Refresh token not found");
    }

    return token;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Lấy tất cả refresh tokens của một user
 * @param {String} user_id - User ID
 * @param {Object} options - Options {includeRevoked, includeExpired}
 * @returns {Array} - Danh sách tokens
 */
const getTokensByUserId = async (
  user_id,
  options = { includeRevoked: false, includeExpired: false }
) => {
  try {
    const where = { user_id };

    // Không lấy token đã revoke
    if (!options.includeRevoked) {
      where.revoked_at = null;
    }

    // Không lấy token đã hết hạn
    if (!options.includeExpired) {
      where.expires_at = {
        gte: new Date(),
      };
    }

    const tokens = await prisma.auth_refresh_tokens.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    return tokens;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Tạo mới refresh token
 * @param {Object} data - Dữ liệu token
 * @param {String} data.token_id - Token ID unique
 * @param {String} data.token_hash - Token hash
 * @param {String} data.user_id - User ID
 * @param {Date} data.expires_at - Thời gian hết hạn
 * @param {String} data.ip_address - IP address
 * @param {String} data.user_agent - User agent
 * @returns {Object} - Token đã tạo
 */
const createRefreshToken = async (data) => {
  try {
    const {
      token_id,
      token_hash,
      user_id,
      expires_at,
      ip_address,
      user_agent,
    } = data;

    // Kiểm tra token_id đã tồn tại
    if (token_id) {
      const existingToken = await prisma.auth_refresh_tokens.findFirst({
        where: { token_id },
      });
      if (existingToken) {
        throw new Error("Token ID already exists");
      }
    }

    // Kiểm tra user tồn tại
    if (user_id) {
      const user = await prisma.auth_base_user.findUnique({
        where: { id: user_id },
      });
      if (!user) {
        throw new Error("User not found");
      }
    }

    const token = await prisma.auth_refresh_tokens.create({
      data: {
        token_id,
        token_hash,
        user_id,
        expires_at,
        ip_address,
        user_agent,
      },
    });

    return token;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Cập nhật refresh token
 * @param {String} id - Token ID
 * @param {Object} data - Dữ liệu cần update
 * @returns {Object} - Token đã cập nhật
 */
const updateRefreshToken = async (id, data) => {
  try {
    // Kiểm tra token tồn tại
    const existingToken = await prisma.auth_refresh_tokens.findUnique({
      where: { id },
    });

    if (!existingToken) {
      throw new Error("Refresh token not found");
    }

    const { token_hash, expires_at, ip_address, user_agent } = data;

    const token = await prisma.auth_refresh_tokens.update({
      where: { id },
      data: {
        token_hash,
        expires_at,
        ip_address,
        user_agent,
        updated_at: new Date(),
      },
    });

    return token;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Revoke (thu hồi) refresh token
 * @param {String} id - Token ID
 * @returns {Object} - Token đã revoke
 */
const revokeRefreshToken = async (id) => {
  try {
    // Kiểm tra token tồn tại
    const existingToken = await prisma.auth_refresh_tokens.findUnique({
      where: { id },
    });

    if (!existingToken) {
      throw new Error("Refresh token not found");
    }

    if (existingToken.revoked_at) {
      throw new Error("Token already revoked");
    }

    const token = await prisma.auth_refresh_tokens.update({
      where: { id },
      data: {
        revoked_at: new Date(),
        updated_at: new Date(),
      },
    });

    return token;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Revoke tất cả tokens của một user
 * @param {String} user_id - User ID
 * @returns {Object} - Số lượng tokens đã revoke
 */
const revokeAllTokensByUserId = async (user_id) => {
  try {
    const result = await prisma.auth_refresh_tokens.updateMany({
      where: {
        user_id,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: `Revoked ${result.count} tokens`,
      count: result.count,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa vĩnh viễn refresh token
 * @param {String} id - Token ID
 * @returns {Object} - Thông báo thành công
 */
const deleteRefreshToken = async (id) => {
  try {
    // Kiểm tra token tồn tại
    const existingToken = await prisma.auth_refresh_tokens.findUnique({
      where: { id },
    });

    if (!existingToken) {
      throw new Error("Refresh token not found");
    }

    await prisma.auth_refresh_tokens.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Refresh token deleted permanently",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa tất cả tokens đã hết hạn
 * @returns {Object} - Số lượng tokens đã xóa
 */
const deleteExpiredTokens = async () => {
  try {
    const result = await prisma.auth_refresh_tokens.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    return {
      success: true,
      message: `Deleted ${result.count} expired tokens`,
      count: result.count,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa tất cả tokens đã bị revoke
 * @returns {Object} - Số lượng tokens đã xóa
 */
const deleteRevokedTokens = async () => {
  try {
    const result = await prisma.auth_refresh_tokens.deleteMany({
      where: {
        revoked_at: {
          not: null,
        },
      },
    });

    return {
      success: true,
      message: `Deleted ${result.count} revoked tokens`,
      count: result.count,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Xóa tất cả tokens của một user
 * @param {String} user_id - User ID
 * @returns {Object} - Số lượng tokens đã xóa
 */
const deleteAllTokensByUserId = async (user_id) => {
  try {
    const result = await prisma.auth_refresh_tokens.deleteMany({
      where: { user_id },
    });

    return {
      success: true,
      message: `Deleted ${result.count} tokens`,
      count: result.count,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Kiểm tra token có hợp lệ không (chưa hết hạn và chưa revoke)
 * @param {String} token_id - Token ID
 * @returns {Boolean} - true nếu token hợp lệ
 */
const isTokenValid = async (token_id) => {
  try {
    const token = await prisma.auth_refresh_tokens.findFirst({
      where: { token_id },
    });

    if (!token) {
      return false;
    }

    // Kiểm tra đã revoke
    if (token.revoked_at) {
      return false;
    }

    // Kiểm tra hết hạn
    if (token.expires_at && new Date() > new Date(token.expires_at)) {
      return false;
    }

    return true;
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  getAllRefreshTokens,
  getRefreshTokenById,
  getRefreshTokenByTokenId,
  getTokensByUserId,
  createRefreshToken,
  updateRefreshToken,
  revokeRefreshToken,
  revokeAllTokensByUserId,
  deleteRefreshToken,
  deleteExpiredTokens,
  deleteRevokedTokens,
  deleteAllTokensByUserId,
  isTokenValid,
};
