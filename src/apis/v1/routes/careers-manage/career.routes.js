const express = require("express");
const router = express.Router();

const careerController = require("../../controllers/careers-manage/career.controller");
const {
  uploadImage,
} = require("../../../../middlewares/upload/file-upload.middleware");

/**
 * @swagger
 * tags:
 *   name: Careers Management - Careers
 *   description: API quản lý nghề nghiệp
 */

/**
 * @swagger
 * /api/v1/careers-manage/careers:
 *   get:
 *     summary: Lấy danh sách nghề nghiệp
 *     tags: [Careers Management - Careers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng items mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, mô tả, tags
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Lọc theo trạng thái kích hoạt
 *
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Get all careers successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Career'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     skip:
 *                       type: integer
 *                       example: 0
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     page:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Lỗi server
 */
router.get("/", careerController.getAllCareers);

/**
 * @swagger
 * /api/v1/careers-manage/careers/{id}:
 *   get:
 *     summary: Lấy nghề nghiệp theo ID
 *     tags: [Careers Management - Careers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Career ID
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Get career successfully
 *                 data:
 *                   $ref: '#/components/schemas/Career'
 *       400:
 *         description: Thiếu Career ID
 *       404:
 *         description: Không tìm thấy nghề nghiệp
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", careerController.getCareerById);

/**
 * @swagger
 * /api/v1/careers-manage/careers:
 *   post:
 *     summary: Tạo mới nghề nghiệp
 *     tags: [Careers Management - Careers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Software Engineer
 *               description:
 *                 type: string
 *                 example: Develops and maintains software applications
 *               tags:
 *                 type: string
 *                 example: technology,programming,IT
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               background_image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh nền nghề nghiệp (max 5MB, jpg/png/gif/webp)
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Create career successfully
 *                 data:
 *                   $ref: '#/components/schemas/Career'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Tên nghề đã tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post(
  "/",
  uploadImage.single("background_image"),
  careerController.createCareer
);

/**
 * @swagger
 * /api/v1/careers-manage/careers/{id}:
 *   put:
 *     summary: Cập nhật nghề nghiệp
 *     tags: [Careers Management - Careers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Career ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Senior Software Engineer
 *               description:
 *                 type: string
 *                 example: Leads software development teams
 *               tags:
 *                 type: string
 *                 example: technology,leadership,programming
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               background_image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh nền mới (nếu muốn thay đổi)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Update career successfully
 *                 data:
 *                   $ref: '#/components/schemas/Career'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy nghề nghiệp
 *       409:
 *         description: Tên nghề đã tồn tại
 *       500:
 *         description: Lỗi server
 */
router.put(
  "/:id",
  uploadImage.single("background_image"),
  careerController.updateCareer
);

/**
 * @swagger
 * /api/v1/careers-manage/careers/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn nghề nghiệp và tất cả tiêu chí liên quan
 *     tags: [Careers Management - Careers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Career ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Career and all related criteria deleted permanently
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy nghề nghiệp
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", careerController.deleteCareer);

/**
 * @swagger
 * /api/v1/careers-manage/careers/{id}/active:
 *   put:
 *     summary: Chuyển đổi trạng thái kích hoạt nghề nghiệp (toggle active/inactive)
 *     tags: [Careers Management - Careers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Career ID
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Update status to true successfully
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy nghề nghiệp
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/active", careerController.activeCareer);

/**
 * @swagger
 * components:
 *   schemas:
 *     Career:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: career-123-abc-456
 *         name:
 *           type: string
 *           example: Software Engineer
 *         description:
 *           type: string
 *           example: Develops and maintains software applications
 *         created_by_admin:
 *           type: string
 *           example: admin-user-id-123
 *         tags:
 *           type: string
 *           example: technology,programming,IT
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = router;
