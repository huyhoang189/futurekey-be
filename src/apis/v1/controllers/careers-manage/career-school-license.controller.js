const { StatusCodes } = require("http-status-codes");
const careerSchoolLicenseService = require("../../services/careers-manage/career-school-license.service");

/**
 * Lấy danh sách licenses theo order_id
 * GET /api/v1/careers-manage/career-school-licenses?order_id=xxx&page=1&limit=10
 */
const getLicensesByOrderId = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { order_id, status } = req.query;

    // Validate
    if (!order_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "order_id is required",
      });
    }

    // Build filters
    const filters = {};

    if (status) {
      filters.status = { equals: status };
    }

    const result = await careerSchoolLicenseService.getLicensesByOrderId({
      order_id,
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get licenses successfully",
      data: result.data,
      meta: {
        ...result.meta,
        page,
      },
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thu hồi license theo ID
 * PUT /api/v1/careers-manage/career-school-licenses/:id/revoke
 */
const revokeLicense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "License ID is required",
      });
    }

    const license = await careerSchoolLicenseService.revokeLicense(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "License revoked successfully",
      data: license,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("already revoked")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Gia hạn license theo ID
 * PUT /api/v1/careers-manage/career-school-licenses/:id/renew
 */
const renewLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiry_date } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "License ID is required",
      });
    }

    if (!expiry_date) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "expiry_date is required",
      });
    }

    const license = await careerSchoolLicenseService.renewLicense(id, {
      expiry_date,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "License renewed successfully",
      data: license,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message.includes("Cannot renew") ||
      error.message.includes("must be after")
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Kích hoạt license theo ID
 * PUT /api/v1/careers-manage/career-school-licenses/:id/activate
 */
const activateLicense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "License ID is required",
      });
    }

    const license = await careerSchoolLicenseService.activateLicense(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "License activated successfully",
      data: license,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message.includes("Cannot activate") ||
      error.message.includes("already active") ||
      error.message.includes("must have")
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getLicensesByOrderId,
  revokeLicense,
  renewLicense,
  activateLicense,
};
