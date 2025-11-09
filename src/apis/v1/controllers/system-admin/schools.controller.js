const { StatusCodes } = require("http-status-codes");
const schoolsService = require("../../services/system-admin/schools.service");

/**
 * Lấy danh sách schools
 * GET /api/v1/system-admin/schools?page=1&limit=10
 */
const getAllSchools = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, name } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { contact_email: { contains: search } },
        { phone_number: { contains: search } },
      ];
    }

    if (name) {
      filters.name = { contains: name };
    }

    const result = await schoolsService.getAllSchools({
      filters,
      paging: { skip, limit },
      orderBy: { created_at: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get all schools successfully",
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
 * Lấy thông tin school theo ID
 * GET /api/v1/system-admin/schools/:id
 */
const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School ID is required",
      });
    }

    const school = await schoolsService.getSchoolById(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get school successfully",
      data: school,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thêm mới school
 * POST /api/v1/system-admin/schools
 */
const createSchool = async (req, res) => {
  try {
    const { name, address, contact_email, phone_number } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School name is required",
      });
    }

    const school = await schoolsService.createSchool({
      name,
      address,
      contact_email,
      phone_number,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Create school successfully",
      data: school,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cập nhật school
 * PUT /api/v1/system-admin/schools/:id
 */
const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contact_email, phone_number } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School ID is required",
      });
    }

    const school = await schoolsService.updateSchool(id, {
      name,
      address,
      contact_email,
      phone_number,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Update school successfully",
      data: school,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xóa vĩnh viễn school
 * DELETE /api/v1/system-admin/schools/:id
 */
const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School ID is required",
      });
    }

    const result = await schoolsService.deleteSchool(id);

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

/**
 * Lấy danh sách classes của school
 * GET /api/v1/system-admin/schools/:id/classes
 */
const getSchoolClasses = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = req.pagination;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School ID is required",
      });
    }

    const result = await schoolsService.getSchoolClasses(id, { skip, limit });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get school classes successfully",
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
 * Lấy danh sách students trong school
 * GET /api/v1/system-admin/schools/:id/students
 */
const getSchoolStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = req.pagination;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "School ID is required",
      });
    }

    const result = await schoolsService.getSchoolStudents(id, { skip, limit });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Get school students successfully",
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

module.exports = {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolClasses,
  getSchoolStudents,
};