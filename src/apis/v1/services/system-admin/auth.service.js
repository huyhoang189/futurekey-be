const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const { hashPassword, verifyPassword } = require("../../../../utils/bcrypt");
const { encode } = require("../../../../utils/jwt");
const { FR } = require("../../../../common");
const settingService = require("./settings.service");

const CURRENT_FR = FR.FR00003 || "FR00003";

/**
 * API Đăng nhập
 * @param {Object} data - Dữ liệu đăng nhập
 * @param {String} data.user_name - Username
 * @param {String} data.password - Password
 * @param {String} data.ip_address - IP address
 * @param {String} data.user_agent - User agent
 * @returns {Object} - {access_token, refresh_token, expires_in, user}
 */
const login = async ({ user_name, password, ip_address, user_agent }) => {
  try {
    // 1. Kiểm tra user tồn tại và status = ACTIVE
    const user = await prisma.auth_base_user.findFirst({
      where: {
        user_name,
        status: "ACTIVE",
      },
    });

    if (!user) {
      throw new Error("Invalid username or user is not active");
    }

    // 2. Lấy cấu hình từ settings
    const [
      loginAttemptLimit,
      lockoutDuration,
      sessionDuration,
      refreshTokenDuration,
    ] = await Promise.all([
      settingService.findSettingByKey("LOGIN_ATTEMPT_LIMIT"),
      settingService.findSettingByKey("LOCKOUT_DURATION_MINUTES"),
      settingService.findSettingByKey("SESSION_DURATION_MINUTES"),
      settingService.findSettingByKey("REFRESH_TOKEN_DURATION_MINUTES"),
    ]);

    const maxAttempts = parseInt(loginAttemptLimit?.value_setting || "10");
    const lockoutMinutes = parseInt(lockoutDuration?.value_setting || "30");
    const sessionMinutes = parseInt(sessionDuration?.value_setting || "15");
    const refreshMinutes = parseInt(
      refreshTokenDuration?.value_setting || "1200"
    );

    // 3. Kiểm tra lockout
    if (user.lockout_util && new Date() < new Date(user.lockout_util)) {
      throw new Error(
        `Account is locked until ${new Date(
          user.lockout_util
        ).toLocaleString()}`
      );
    }

    // 4. Kiểm tra login attempts
    if (user.login_attempts >= maxAttempts) {
      // Khóa tài khoản
      const lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      await prisma.auth_base_user.update({
        where: { id: user.id },
        data: {
          lockout_util: lockoutUntil,
          updated_at: new Date(),
        },
      });
      throw new Error(
        `Too many login attempts. Account locked until ${lockoutUntil.toLocaleString()}`
      );
    }

    // 5. Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      // Tăng login_attempts
      const newAttempts = (user.login_attempts || 0) + 1;
      const updateData = {
        login_attempts: newAttempts,
        updated_at: new Date(),
      };

      // Nếu vượt quá giới hạn thì khóa luôn
      if (newAttempts >= maxAttempts) {
        updateData.lockout_util = new Date(
          Date.now() + lockoutMinutes * 60 * 1000
        );
      }

      await prisma.auth_base_user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new Error(
        `Invalid password. Attempts remaining: ${maxAttempts - newAttempts}`
      );
    }

    // 6. Password đúng - Tạo tokens
    const jti = uuidv4(); // JTI = UUID

    // Tạo access token
    const accessTokenPayload = {
      sub: user.id,
      jti: jti,
      user_name: user.user_name,
      email: user.email,
    };

    const access_token = encode({
      payload: accessTokenPayload,
      timeExpired: sessionMinutes,
    });

    // Tạo refresh token
    const refresh_token = uuidv4(); // Refresh token là UUID string

    // Hash refresh token
    const token_hash = await hashPassword(refresh_token, 10);

    // Tính expires_at cho refresh token
    const expires_at = new Date(Date.now() + refreshMinutes * 60 * 1000);

    // Insert vào refresh_tokens
    await prisma.auth_refresh_tokens.create({
      data: {
        token_id: jti,
        token_hash,
        user_id: user.id,
        expires_at,
        ip_address,
        user_agent,
      },
    });

    // 7. Cập nhật user: latest_login, last_seen_at, reset login_attempts
    await prisma.auth_base_user.update({
      where: { id: user.id },
      data: {
        latest_login: new Date(),
        last_seen_at: new Date(),
        login_attempts: 0,
        lockout_util: null, // Clear lockout
        updated_at: new Date(),
      },
    });

    // 8. Trả về response (không trả password_hash)
    const { password_hash: _, ...userInfo } = user;

    return {
      access_token,
      refresh_token,
      expires_in: sessionMinutes * 60, // Trả về giây
      user: userInfo,
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Làm mới token (Refresh Token)
 * @param {Object} data - Dữ liệu refresh
 * @param {String} data.refresh_token - Refresh token
 * @param {String} data.ip_address - IP address
 * @param {String} data.user_agent - User agent
 * @returns {Object} - {access_token, refresh_token, expires_in}
 */
const refreshToken = async ({ refresh_token, ip_address, user_agent }) => {
  try {
    // 1. Tìm tất cả tokens (vì token_hash không thể query trực tiếp)
    const allTokens = await prisma.auth_refresh_tokens.findMany({
      where: {
        revoked_at: null,
        expires_at: {
          gt: new Date(), // Chưa hết hạn
        },
      },
    });

    // Verify refresh_token với từng token_hash
    let validToken = null;
    for (const token of allTokens) {
      const isMatch = await verifyPassword(refresh_token, token.token_hash);
      if (isMatch) {
        validToken = token;
        break;
      }
    }

    // 2. Kiểm tra token không tìm thấy hoặc không hợp lệ
    if (!validToken) {
      throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }

    // 3. Lấy thông tin user và kiểm tra status
    const user = await prisma.auth_base_user.findUnique({
      where: { id: validToken.user_id },
      select: {
        id: true,
        user_name: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      // Xóa token nếu user không tồn tại hoặc không active
      await prisma.auth_refresh_tokens.delete({
        where: { id: validToken.id },
      });
      throw new Error("User không còn active");
    }

    // 4. Lấy cấu hình
    const [sessionDuration, refreshTokenDuration] = await Promise.all([
      settingService.findSettingByKey("SESSION_DURATION_MINUTES"),
      settingService.findSettingByKey("REFRESH_TOKEN_DURATION_MINUTES"),
    ]);

    const sessionMinutes = parseInt(sessionDuration?.value_setting || "15");
    const refreshMinutes = parseInt(
      refreshTokenDuration?.value_setting || "1200"
    );

    // 5. Tạo tokens mới
    const jti = uuidv4(); // JTI mới

    // Tạo access token mới
    const accessTokenPayload = {
      sub: validToken.user_id,
      jti: jti,
      user_name: user.user_name,
      email: user.email,
    };

    const new_access_token = encode({
      payload: accessTokenPayload,
      timeExpired: sessionMinutes,
    });

    // Tạo refresh token mới
    const new_refresh_token = uuidv4();

    // Hash refresh token mới
    const new_token_hash = await hashPassword(new_refresh_token, 10);

    // Tính expires_at cho refresh token mới
    const new_expires_at = new Date(Date.now() + refreshMinutes * 60 * 1000);

    // 6. INSERT bản ghi mới
    await prisma.auth_refresh_tokens.create({
      data: {
        token_id: jti,
        token_hash: new_token_hash,
        user_id: validToken.user_id,
        expires_at: new_expires_at,
        ip_address,
        user_agent,
      },
    });

    // 7. UPDATE bản ghi cũ: revoked_at = NOW()
    await prisma.auth_refresh_tokens.update({
      where: { id: validToken.id },
      data: {
        revoked_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 8. Cập nhật user.last_seen_at
    await prisma.auth_base_user.update({
      where: { id: validToken.user_id },
      data: {
        last_seen_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 9. Trả về tokens mới
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token,
      expires_in: sessionMinutes * 60, // Trả về giây
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

/**
 * Đăng xuất
 * @param {Object} data - Dữ liệu logout
 * @param {String} data.refresh_token - Refresh token
 * @returns {Object} - {message}
 */
const logout = async ({ refresh_token }) => {
  try {
    // 1. Tìm tất cả tokens chưa bị revoke
    const allTokens = await prisma.auth_refresh_tokens.findMany({
      where: {
        revoked_at: null,
      },
    });

    // 2. Verify refresh_token với từng token_hash
    let validToken = null;
    for (const token of allTokens) {
      const isMatch = await verifyPassword(refresh_token, token.token_hash);
      if (isMatch) {
        validToken = token;
        break;
      }
    }

    // 3. Nếu không tìm thấy token
    if (!validToken) {
      throw new Error("Token không hợp lệ");
    }

    // 4. UPDATE revoked_at = NOW()
    await prisma.auth_refresh_tokens.update({
      where: { id: validToken.id },
      data: {
        revoked_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      message: "Đăng xuất thành công",
    };
  } catch (error) {
    throw new Error(`${CURRENT_FR} - ${error.message}`);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
};
