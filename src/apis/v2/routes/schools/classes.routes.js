const express = require("express");
const router = express.Router();
const pagination = require("../../../../middlewares/validation/pagination");
const classesController = require("../../controllers/schools/classes.controller");

/**
 * @swagger
 * tags:
 *   name: V2 - Schools - Classes
 *   description: API quản lý lớp học cho trường
 */

/**
 * @swagger
 * /api/v2/schools/classes:
 *   get:
 *     summary: Lấy danh sách lớp học của trường
 *     tags: [V2 - Schools - Classes]
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
 *         description: Số lượng bản ghi
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên
 *       - in: query
 *         name: grade_level
 *         schema:
 *           type: integer
 *         description: Lọc theo cấp lớp
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
 *                   example: Get all classes successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SchoolClass'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get("/", pagination, classesController.getAllClasses);

/**
 * @swagger
 * /api/v2/schools/classes:
 *   post:
 *     summary: Tạo mới lớp học
 *     tags: [V2 - Schools - Classes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               grade_level:
 *                 type: integer
 *               school_id:
 *                 type: string
 *               homeroom_teacher_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/", classesController.createClass);

/**
 * @swagger
 * /api/v2/schools/classes/{id}:
 *   get:
 *     summary: Lấy chi tiết lớp học theo ID
 *     tags: [V2 - Schools - Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SchoolClass'
 */
router.get("/:id", classesController.getClassById);

/**
 * @swagger
 * /api/v2/schools/classes/{id}:
 *   put:
 *     summary: Cập nhật thông tin lớp học
 *     tags: [V2 - Schools - Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               grade_level:
 *                 type: integer
 *               school_id:
 *                 type: string
 *               homeroom_teacher_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", classesController.updateClass);

/**
 * @swagger
 * /api/v2/schools/classes/{id}:
 *   delete:
 *     summary: Xóa lớp học nếu không có học sinh
 *     tags: [V2 - Schools - Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:id", classesController.deleteClass);

/**
 * @swagger
 * components:
 *   schemas:
 *     SchoolClass:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         grade_level:
 *           type: integer
 *         school_id:
 *           type: string
 *         homeroom_teacher:
 *           type: object
 *         school:
 *           type: object
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         limit:
 *           type: integer
 *         skip:
 *           type: integer
 *         page:
 *           type: integer
 */
module.exports = router;
