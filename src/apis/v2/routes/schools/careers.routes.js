const express = require("express");
const router = express.Router();
const careersController = require("../../controllers/schools/careers.controller");
const pagination = require("../../../../middlewares/validation/pagination");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Careers
 *   description: API cho trường học lấy danh sách nghề đang active và các tiêu chí liên quan
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SchoolActiveCareer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         code:
 *           type: string
 *           example: "IT001"
 *         name:
 *           type: string
 *           example: "Lập trình viên"
 *         description:
 *           type: string
 *           example: "Nghề lập trình phần mềm"
 *         background_image_url:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/thumbnail.jpg"
 *         careerCategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "category-1"
 *               name:
 *                 type: string
 *                 example: "Công nghệ thông tin"
 *     CareerCriteria:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         order_index:
 *           type: integer
 *         is_active:
 *           type: boolean
 *         career_id:
 *           type: string
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
 *                 name:
 *                   type: string
 *                 background_image_url:
 *                   type: string
 *                   nullable: true
 */

/**
 * @swagger
 * /api/v2/schools/careers/active:
 *   get:
 *     summary: Lấy danh sách nghề đang active mà trường đang sở hữu license
 *     tags: [V2 - Schools - Careers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang muốn lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Trường dùng để sắp xếp
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
 *       - in: query
 *         name: category_ids
 *         schema:
 *           type: string
 *         description: Danh sách category_id phân tách bằng dấu phẩy để lọc theo nhóm nghề
 *     responses:
 *       200:
 *         description: Danh sách nghề đang active với metadata pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SchoolActiveCareer'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Thiếu school_id hoặc tham số không hợp lệ
 *       404:
 *         description: Không tìm thấy trường
 *       500:
 *         description: Lỗi máy chủ
 */
router.get("/active", careersController.getActiveCareersForSchool);

/**
 * @swagger
 * /api/v2/schools/careers/criteria/career/{career_id}:
 *   get:
 *     summary: Lấy tất cả tiêu chí nghề theo career_id
 *     tags: [V2 - Schools - Careers]
 *     parameters:
 *       - in: path
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề để lấy tiêu chí
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang muốn lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mô tả tiêu chí (tuỳ chọn)
 *     responses:
 *       200:
 *         description: Danh sách tiêu chí theo nghề
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CareerCriteriaWithCareer'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     skip:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     page:
 *                       type: integer
 *       400:
 *         description: career_id là tham số bắt buộc
 *       500:
 *         description: Lỗi máy chủ
 */
router.get(
  "/criteria/career/:career_id",
  careersController.getCriteriaByCareerId
);

/**
 * @swagger
 * /api/v2/schools/careers/criteria/{id}:
 *   get:
 *     summary: Lấy tiêu chí nghề theo ID
 *     tags: [V2 - Schools - Careers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của tiêu chí nghề
 *     responses:
 *       200:
 *         description: Thông tin tiêu chí
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CareerCriteriaWithCareer'
 *       400:
 *         description: Missing criteria ID
 *       404:
 *         description: Criteria not found
 */
router.get("/criteria/:id", careersController.getCareerCriteriaById);

/**
 * @swagger
 * /api/v2/schools/careers/config-criteria-to-class:
 *   get:
 *     summary: Lấy danh sách criteria_id đã gắn cho một lớp và nghề
 *     tags: [V2 - Schools - Careers]
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: career_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of configured criteria IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing query parameters
 */
router.get(
  "/config-criteria-to-class",
  careersController.getConfigOfCareerCriteriaForClass
);

/**
 * @swagger
 * /api/v2/schools/careers/config-criteria-to-class:
 *   post:
 *     summary: Gán một criteria cho một lớp và nghề
 *     tags: [V2 - Schools - Careers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - criteria_id
 *             properties:
 *               class_id:
 *                 type: string
 *               career_id:
 *                 type: string
 *               criteria_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Config created
 */
router.post(
  "/config-criteria-to-class",
  careersController.configCareerCriteriaForClass
);

/**
 * @swagger
 * /api/v2/schools/careers/config-criteria-to-class:
 *   delete:
 *     summary: Gỡ một criteria khỏi lớp và nghề
 *     tags: [V2 - Schools - Careers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - career_id
 *               - criteria_id
 *             properties:
 *               class_id:
 *                 type: string
 *               career_id:
 *                 type: string
 *               criteria_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Config removed
 */
router.delete(
  "/config-criteria-to-class",
  careersController.removeCareerCriteriaConfigForClass
);

/**
 * @swagger
 * /api/v2/schools/careers/{id}:
 *   get:
 *     summary: Lấy chi tiết nghề (ảnh nền, nhóm nghề)
 *     tags: [V2 - Schools - Careers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của nghề
 *     responses:
 *       200:
 *         description: Chi tiết nghề
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolActiveCareer'
 *       400:
 *         description: Missing career ID
 *       404:
 *         description: Career not found
 */
router.get("/:id", careersController.getCareerById);

module.exports = router;
