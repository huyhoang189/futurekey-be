const { StatusCodes } = require("http-status-codes");
const careerService = require("../../services/careers-manage/career.service");
const userService = require("../../services/system-admin/users.service");
/**
 * Lấy danh sách nghề nghiệp
 * GET /api/v1/careers-manage/careers?page=1&limit=10
 */
const getAllCareers = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, is_active } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    if (is_active !== undefined) {
      filters.is_active = is_active === "true";
    }

    const result = await careerService.getAllCareers({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all careers successfully",
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
 * Lấy nghề nghiệp theo ID
 * GET /api/v1/careers-manage/careers/:id
 */
const getCareerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career ID is required",
      });
    }

    const career = await careerService.getCareerById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get career successfully",
      data: career,
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
 * Thêm mới nghề nghiệp
 * POST /api/v1/careers-manage/careers
 */
const createCareer = async (req, res) => {
  try {
    const { code, name, description, tags, is_active, career_category_ids } =
      req.body;
    const imageFile = req.file; // File từ multer middleware

    const { userSession } = req;
    const holderUser = await userService.getUserByUsername(
      userSession?.user_name
    );
    if (!holderUser) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    //Validate career_category_ids
    let resultArray = career_category_ids.split(",");
    resultArray = resultArray
      .map((item) => item.trim())
      .filter((item) => item !== "");

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career name is required",
      });
    }

    const career = await careerService.createCareer(
      {
        code,
        name,
        description,
        created_by_admin: holderUser.id,
        tags,
        is_active: is_active === "true" || is_active === true,
        career_category_ids: resultArray,
      },
      imageFile // Truyền file vào service
    );

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create career successfully",
      data: career,
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(StatusCodes.CONFLICT).json({
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
 * Cập nhật nghề nghiệp
 * PUT /api/v1/careers-manage/careers/:id
 */
const updateCareer = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, tags, is_active, career_category_ids } =
      req.body;
    const imageFile = req.file; // File từ multer middleware

    const { userSession } = req;
    const holderUser = await userService.getUserByUsername(
      userSession?.user_name
    );
    if (!holderUser) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career ID is required",
      });
    }

    //Validate career_category_ids
    let resultArray = career_category_ids.split(",");
    resultArray = resultArray
      .map((item) => item.trim())
      .filter((item) => item !== "");

    const career = await careerService.updateCareer(
      id,
      {
        code,
        name,
        description,
        created_by_admin: holderUser.id,
        tags,
        is_active:
          is_active !== undefined
            ? is_active === "true" || is_active === true
            : undefined,
        career_category_ids: resultArray,
      },
      imageFile // Truyền file vào service
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update career successfully",
      data: career,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("already exists")) {
      return res.status(StatusCodes.CONFLICT).json({
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
 * Xóa vĩnh viễn nghề nghiệp và tất cả tiêu chí liên quan
 * DELETE /api/v1/careers-manage/careers/:id
 */
const deleteCareer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career ID is required",
      });
    }

    const result = await careerService.deleteCareer(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
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
 * Cập nhật trạng thái kích hoạt nghề nghiệp
 * PUT /api/v1/careers-manage/careers/:id/active
 */
const activeCareer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Career ID is required",
      });
    }

    const career = await careerService.getCareerById(id);
    if (!career) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Career not found",
      });
    }

    await careerService.updateCareer(id, {
      career,
      is_active: !career.is_active,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Update status to ${!career.is_active} successfully`,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
  activeCareer,
};
