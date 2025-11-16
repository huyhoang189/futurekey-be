const express = require("express");
const router = express.Router();
const classesController = require("../../controllers/system-admin/classes.controller");

/**
 * @swagger
 * tags:
 *   name: System Admin - Classes
 *   description: API quản lý lớp học
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def
 *         name:
 *           type: string
 *           example: Lớp 10A1
 *         grade_level:
 *           type: integer
 *           example: 10
 *           minimum: 1
 *           maximum: 12
 *         school_id:
 *           type: string
 *           example: school-123-def
 *         homeroom_teacher_id:
 *           type: string
 *           example: teacher-123-def
 *         school:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: school-123-def
 *             name:
 *               type: string
 *               example: Trường THPT ABC
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     ClassStudent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def
 *         user_id:
 *           type: string
 *           example: user-123-def
 *         school_id:
 *           type: string
 *           example: school-123-def
 *         class_id:
 *           type: string
 *           example: class-123-def
 *         sex:
 *           type: string
 *           enum: [OTHER, MALE, FEMALE]
 *           example: MALE
 *         birthday:
 *           type: string
 *           format: date
 *           example: 2005-01-15
 *         description:
 *           type: string
 *           example: Học sinh giỏi
 *         major_interest:
 *           type: string
 *           example: Toán học, Vật lý
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/system-admin/classes:
 *   get:
 *     summary: Lấy danh sách classes
 *     tags: [System Admin - Classes]
 *     security:
 *       - bearerAuth: []
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
 *         description: Tìm kiếm theo tên lớp
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Lọc theo tên lớp
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: string
 *         description: Lọc theo trường học
 *       - in: query
 *         name: grade_level
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Lọc theo khối lớp
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
 *                     $ref: '#/components/schemas/Class'
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
router.get("/", classesController.getAllClasses);

/**
 * @swagger
 * /api/v1/system-admin/classes/{id}:
 *   get:
 *     summary: Lấy thông tin class theo ID
 *     tags: [System Admin - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
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
 *                   example: Get class successfully
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", classesController.getClassById);

/**
 * @swagger
 * /api/v1/system-admin/classes:
 *   post:
 *     summary: Tạo mới class
 *     tags: [System Admin - Classes]
 *     security:
 *       - bearerAuth: []
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
 *                 example: Lớp 10A1
 *               grade_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 10
 *               school_id:
 *                 type: string
 *                 example: school-123-def
 *               homeroom_teacher_id:
 *                 type: string
 *                 example: teacher-123-def
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
 *                   example: Create class successfully
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/", classesController.createClass);

/**
 * @swagger
 * /api/v1/system-admin/classes/{id}:
 *   put:
 *     summary: Cập nhật class
 *     tags: [System Admin - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Lớp 10A2
 *               grade_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 10
 *               school_id:
 *                 type: string
 *                 example: school-456-xyz
 *               homeroom_teacher_id:
 *                 type: string
 *                 example: teacher-456-xyz
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
 *                   example: Update class successfully
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", classesController.updateClass);

/**
 * @swagger
 * /api/v1/system-admin/classes/{id}:
 *   delete:
 *     summary: Xóa class
 *     tags: [System Admin - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
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
 *                   example: Delete class successfully
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", classesController.deleteClass);

/**
 * @swagger
 * /api/v1/system-admin/classes/{id}/students:
 *   get:
 *     summary: Lấy danh sách students của class
 *     tags: [System Admin - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
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
 *                   example: Get class students successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClassStudent'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 30
 *                     skip:
 *                       type: integer
 *                       example: 0
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     page:
 *                       type: integer
 *                       example: 1
 *       404:
 *         description: Không tìm thấy class
 *       500:
 *         description: Lỗi server
 */
router.get("/:id/students", classesController.getClassStudents);

module.exports = router;