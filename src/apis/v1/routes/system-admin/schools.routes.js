const express = require("express");
const router = express.Router();
const schoolsController = require("../../controllers/system-admin/schools.controller");

/**
 * @swagger
 * tags:
 *   name: System Admin - Schools
 *   description: API quản lý trường học
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     School:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: abc-123-def
 *         name:
 *           type: string
 *           example: Trường THPT ABC
 *         address:
 *           type: string
 *           example: 123 Đường ABC, Quận 1, TP.HCM
 *         contact_email:
 *           type: string
 *           format: email
 *           example: contact@school.edu.vn
 *         phone_number:
 *           type: string
 *           example: 0123456789
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
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
 *         school_id:
 *           type: string
 *           example: school-123-def
 *         homeroom_teacher_id:
 *           type: string
 *           example: teacher-123-def
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Student:
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
 * /api/v1/system-admin/schools:
 *   get:
 *     summary: Lấy danh sách schools
 *     tags: [System Admin - Schools]
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
 *         description: Tìm kiếm theo tên, địa chỉ, email, số điện thoại
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Lọc theo tên trường
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
 *                   example: Get all schools successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/School'
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
router.get("/", schoolsController.getAllSchools);

/**
 * @swagger
 * /api/v1/system-admin/schools/{id}:
 *   get:
 *     summary: Lấy thông tin school theo ID
 *     tags: [System Admin - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
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
 *                   example: Get school successfully
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", schoolsController.getSchoolById);

/**
 * @swagger
 * /api/v1/system-admin/schools:
 *   post:
 *     summary: Tạo mới school
 *     tags: [System Admin - Schools]
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
 *                 example: Trường THPT ABC
 *               address:
 *                 type: string
 *                 example: 123 Đường ABC, Quận 1, TP.HCM
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 example: contact@school.edu.vn
 *               phone_number:
 *                 type: string
 *                 example: 0123456789
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
 *                   example: Create school successfully
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/", schoolsController.createSchool);

/**
 * @swagger
 * /api/v1/system-admin/schools/{id}:
 *   put:
 *     summary: Cập nhật school
 *     tags: [System Admin - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Trường THPT ABC Updated
 *               address:
 *                 type: string
 *                 example: 456 Đường XYZ, Quận 2, TP.HCM
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 example: new-contact@school.edu.vn
 *               phone_number:
 *                 type: string
 *                 example: 0987654321
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
 *                   example: Update school successfully
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", schoolsController.updateSchool);

/**
 * @swagger
 * /api/v1/system-admin/schools/{id}:
 *   delete:
 *     summary: Xóa school
 *     tags: [System Admin - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
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
 *                   example: Delete school successfully
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", schoolsController.deleteSchool);

/**
 * @swagger
 * /api/v1/system-admin/schools/{id}/classes:
 *   get:
 *     summary: Lấy danh sách classes của school
 *     tags: [System Admin - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
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
 *                   example: Get school classes successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
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
 *       404:
 *         description: Không tìm thấy school
 *       500:
 *         description: Lỗi server
 */
router.get("/:id/classes", schoolsController.getSchoolClasses);

/**
 * @swagger
 * /api/v1/system-admin/schools/{id}/students:
 *   get:
 *     summary: Lấy danh sách students của school
 *     tags: [System Admin - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
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
 *                   example: Get school students successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 1000
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
 *         description: Không tìm thấy school
 *       500:
 *         description: Lỗi server
 */
router.get("/:id/students", schoolsController.getSchoolStudents);

module.exports = router;