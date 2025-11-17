const express = require("express");
const router = express.Router();
const studentsController = require("../../controllers/system-admin/students.controller");

/**
 * @swagger
 * tags:
 *   name: System Admin - Students
 *   description: API quản lý học sinh
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: student-123-def
 *         user_id:
 *           type: string
 *           example: user-456-abc
 *         school_id:
 *           type: string
 *           example: school-789-xyz
 *         class_id:
 *           type: string
 *           example: class-101-qwe
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
 *           example: Học sinh giỏi toán
 *         major_interest:
 *           type: string
 *           example: Toán học, Vật lý, Lập trình
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: user-456-abc
 *             user_name:
 *               type: string
 *               example: student001
 *             full_name:
 *               type: string
 *               example: Nguyễn Văn An
 *             email:
 *               type: string
 *               example: student001@school.edu.vn
 *             phone_number:
 *               type: string
 *               example: 0123456789
 *             status:
 *               type: string
 *               enum: [ACTIVE, INACTIVE, BANNER]
 *               example: ACTIVE
 *         school:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: school-789-xyz
 *             name:
 *               type: string
 *               example: THPT Lê Quý Đôn
 *         class:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: class-101-qwe
 *             name:
 *               type: string
 *               example: 10A1
 *             grade_level:
 *               type: integer
 *               example: 10
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/system-admin/students:
 *   get:
 *     summary: Lấy danh sách students
 *     tags: [System Admin - Students]
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
 *         description: Tìm kiếm theo mô tả, sở thích
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: string
 *         description: Lọc theo trường học
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: string
 *         description: Lọc theo lớp học
 *       - in: query
 *         name: sex
 *         schema:
 *           type: string
 *           enum: [OTHER, MALE, FEMALE]
 *         description: Lọc theo giới tính
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
 *                   example: Get all students successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
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
router.get("/", studentsController.getAllStudents);

/**
 * @swagger
 * /api/v1/system-admin/students/{id}:
 *   get:
 *     summary: Lấy thông tin student theo ID
 *     tags: [System Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
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
 *                   example: Get student successfully
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get("/:id", studentsController.getStudentById);

/**
 * @swagger
 * /api/v1/system-admin/students:
 *   post:
 *     summary: Tạo mới student (tự động tạo user account)
 *     tags: [System Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_name
 *               - full_name
 *             properties:
 *               user_name:
 *                 type: string
 *                 example: student001
 *                 description: Tên đăng nhập (unique)
 *               full_name:
 *                 type: string
 *                 example: Nguyễn Văn An
 *                 description: Họ tên đầy đủ
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student001@school.edu.vn
 *                 description: Email (unique)
 *               phone_number:
 *                 type: string
 *                 example: 0123456789
 *                 description: Số điện thoại (10 chữ số)
 *               password:
 *                 type: string
 *                 example: password123
 *                 description: Mật khẩu (nếu không có sẽ dùng 'student123')
 *               address:
 *                 type: string
 *                 example: 123 Đường ABC, Quận 1, TP.HCM
 *                 description: Địa chỉ
 *               school_id:
 *                 type: string
 *                 example: school-789-xyz
 *                 description: ID trường học
 *               class_id:
 *                 type: string
 *                 example: class-101-qwe
 *                 description: ID lớp học
 *               sex:
 *                 type: string
 *                 enum: [OTHER, MALE, FEMALE]
 *                 example: MALE
 *                 description: Giới tính
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: 2005-01-15
 *                 description: Ngày sinh (tuổi từ 5-25)
 *               description:
 *                 type: string
 *                 example: Học sinh giỏi toán
 *                 description: Mô tả
 *               major_interest:
 *                 type: string
 *                 example: Toán học, Vật lý, Lập trình
 *                 description: Sở thích chính
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
 *                   example: Create student successfully
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/", studentsController.createStudent);

/**
 * @swagger
 * /api/v1/system-admin/students/{id}:
 *   put:
 *     summary: Cập nhật thông tin student và user
 *     tags: [System Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student:
 *                 type: object
 *                 description: Thông tin student (auth_impl_user_student)
 *                 properties:
 *                   school_id:
 *                     type: string
 *                     example: school-789-xyz
 *                   class_id:
 *                     type: string
 *                     example: class-101-qwe
 *                   sex:
 *                     type: string
 *                     enum: [OTHER, MALE, FEMALE]
 *                     example: MALE
 *                   birthday:
 *                     type: string
 *                     format: date
 *                     example: 2005-01-15
 *                   description:
 *                     type: string
 *                     example: Học sinh giỏi toán
 *                   major_interest:
 *                     type: string
 *                     example: Toán học, Vật lý, Lập trình
 *               base_user:
 *                 type: object
 *                 description: Thông tin user cơ bản (auth_base_user)
 *                 properties:
 *                   user_name:
 *                     type: string
 *                     example: student001_updated
 *                   full_name:
 *                     type: string
 *                     example: Nguyễn Văn An
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: student001@school.edu.vn
 *                   phone_number:
 *                     type: string
 *                     example: 0987654321
 *                   address:
 *                     type: string
 *                     example: Hà Nội
 *                   status:
 *                     type: string
 *                     enum: [ACTIVE, INACTIVE]
 *                     example: ACTIVE
 *           example:
 *             student:
 *               school_id: school-002
 *               class_id: class-10A1
 *               sex: MALE
 *               birthday: 2005-08-15
 *               description: Học sinh giỏi toán
 *               major_interest: Toán học, Lập trình
 *             base_user:
 *               user_name: student_nguyen
 *               full_name: Nguyễn Văn An
 *               email: nguyenvanan@school.edu.vn
 *               phone_number: 0912345678
 *               address: Hà Nội
 *               status: ACTIVE
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
 *                   example: Update student successfully
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.put("/:id", studentsController.updateStudent);

/**
 * @swagger
 * /api/v1/system-admin/students/{id}/user:
 *   put:
 *     summary: Cập nhật thông tin user của student
 *     tags: [System Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *                 example: student001_updated
 *               full_name:
 *                 type: string
 *                 example: Nguyễn Văn An Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student001_new@school.edu.vn
 *               phone_number:
 *                 type: string
 *                 example: 0987654321
 *               address:
 *                 type: string
 *                 example: 456 Đường XYZ, Quận 2, TP.HCM
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
 *                   example: Update student user info successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: user-456-abc
 *                     user_name:
 *                       type: string
 *                       example: student001_updated
 *                     full_name:
 *                       type: string
 *                       example: Nguyễn Văn An Updated
 *                     email:
 *                       type: string
 *                       example: student001_new@school.edu.vn
 *                     phone_number:
 *                       type: string
 *                       example: 0987654321
 *                     address:
 *                       type: string
 *                       example: 456 Đường XYZ, Quận 2, TP.HCM
 *                     status:
 *                       type: string
 *                       example: ACTIVE
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.put("/:id/user", studentsController.updateStudentUser);

/**
 * @swagger
 * /api/v1/system-admin/students/{id}:
 *   delete:
 *     summary: Xóa student
 *     tags: [System Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: deleteUser
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Có xóa luôn user account không (true/false)
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
 *                   example: Delete student successfully
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.delete("/:id", studentsController.deleteStudent);

module.exports = router;