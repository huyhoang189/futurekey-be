const express = require("express");
const router = express.Router();

const careerCriteriaController = require("../../controllers/careers-manage/career-criteria.controller");
const {
  uploadCriteriaFiles,
} = require("../../../../middlewares/upload/file-upload.middleware");

// Apply pagination middleware to GET all endpoint

/**
 * @swagger
 * tags:
 *   name: Careers Management - Career Criteria
 *   description: API quản lý tiêu chí nghề nghiệp
 */

/**
 * @swagger
 * /api/v1/careers-manage/career-criteria:
 *   get:
 *     summary: Lấy danh sách tiêu chí nghề nghiệp
 *     tags: [Careers Management - Career Criteria]
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
 *         description: Tìm kiếm theo tên, mô tả
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Lọc theo trạng thái kích hoạt
 *       - in: query
 *         name: career_id
 *         schema:
 *           type: string
 *         description: Lọc theo nghề nghiệp (career ID)
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
 *                   example: Get all career criteria successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CareerCriteriaWithCareer'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
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
router.get("/", careerCriteriaController.getAllCareerCriteria);

/**
 * @swagger
 * /api/v1/careers-manage/career-criteria/{id}:
 *   get:
 *     summary: Lấy tiêu chí nghề nghiệp theo ID
 *     tags: [Careers Management - Career Criteria]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Career Criteria ID
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
 *                   example: Get career criteria successfully
 *                 data:
 *                   $ref: '#/components/schemas/CareerCriteriaWithCareer'
 *       400:
 *         description: Thiếu Career Criteria ID
 *       404:
 *         description: Không tìm thấy tiêu chí nghề nghiệp
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", careerCriteriaController.getCareerCriteriaById);

/**
 * @swagger
 * /api/v1/careers-manage/career-criteria:
 *   post:
 *     summary: Tạo mới tiêu chí nghề nghiệp
 *     tags: [Careers Management - Career Criteria]
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
 *               - career_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Problem Solving Skills
 *               description:
 *                 type: string
 *                 example: Ability to analyze and solve complex problems
 *               order_index:
 *                 type: integer
 *                 example: 1
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               career_id:
 *                 type: string
 *                 example: career-123-abc-456
 *               video_thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh thumbnail của video (max 5MB, jpg/png/gif/webp)
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video của tiêu chí (max 100MB, mp4/avi/mov/wmv/flv/mkv)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Danh sách file đính kèm (max 10 files, 10MB mỗi file)
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
 *                   example: Create career criteria successfully
 *                 data:
 *                   $ref: '#/components/schemas/CareerCriteria'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy nghề nghiệp
 *       409:
 *         description: Tên tiêu chí đã tồn tại trong nghề nghiệp này
 *       500:
 *         description: Lỗi server
 */
router.post(
  "/",
  uploadCriteriaFiles,
  careerCriteriaController.createCareerCriteria
);

/**
 * @swagger
 * /api/v1/careers-manage/career-criteria/{id}:
 *   put:
 *     summary: Cập nhật tiêu chí nghề nghiệp
 *     tags: [Careers Management - Career Criteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Career Criteria ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Advanced Problem Solving
 *               description:
 *                 type: string
 *                 example: Expert level problem solving abilities
 *               order_index:
 *                 type: integer
 *                 example: 2
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               career_id:
 *                 type: string
 *                 example: career-123-abc-456
 *               video_thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh thumbnail mới (nếu cập nhật)
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video mới (nếu cập nhật)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Danh sách file đính kèm mới (nếu cập nhật, sẽ thay thế tất cả)
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
 *                   example: Update career criteria successfully
 *                 data:
 *                   $ref: '#/components/schemas/CareerCriteria'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy tiêu chí nghề nghiệp hoặc nghề nghiệp
 *       409:
 *         description: Tên tiêu chí đã tồn tại trong nghề nghiệp này
 *       500:
 *         description: Lỗi server
 */
router.put(
  "/:id",
  uploadCriteriaFiles,
  careerCriteriaController.updateCareerCriteria
);

/**
 * @swagger
 * /api/v1/careers-manage/career-criteria/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn tiêu chí nghề nghiệp
 *     tags: [Careers Management - Career Criteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Career Criteria ID
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
 *                   example: Career criteria deleted permanently
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy tiêu chí nghề nghiệp
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", careerCriteriaController.deleteCareerCriteria);

/**
 * @swagger
 * /api/v1/careers-manage/career-criteria/{id}/active:
 *   put:
 *     summary: Chuyển đổi trạng thái kích hoạt tiêu chí nghề nghiệp (toggle active/inactive)
 *     tags: [Careers Management - Career Criteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Career Criteria ID
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
 *         description: Không tìm thấy tiêu chí nghề nghiệp
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/active", careerCriteriaController.activeCareerCriteria);

/**
 * @swagger
 * components:
 *   schemas:
 *     CareerCriteria:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: criteria-123-abc-456
 *         name:
 *           type: string
 *           example: Problem Solving Skills
 *         description:
 *           type: string
 *           example: Ability to analyze and solve complex problems
 *         order_index:
 *           type: integer
 *           example: 1
 *         is_active:
 *           type: boolean
 *           example: true
 *         career_id:
 *           type: string
 *           example: career-123-abc-456
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CareerCriteriaWithCareer:
 *       allOf:
 *         - $ref: '#/components/schemas/CareerCriteria'
 *         - type: object
 *           properties:
 *             career:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: career-123-abc-456
 *                 name:
 *                   type: string
 *                   example: Software Engineer
 *                 description:
 *                   type: string
 *                   example: Develops and maintains software
 *                 tags:
 *                   type: string
 *                   example: technology,programming
 *                 is_active:
 *                   type: boolean
 *                   example: true
 */

module.exports = router;
