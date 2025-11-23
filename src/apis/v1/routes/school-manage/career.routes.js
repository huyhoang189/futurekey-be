const express = require("express");
const router = express.Router();
const careerController = require("../../controllers/school-manage/career.controller");

/**
 * @swagger
 * tags:
 *   name: School - Career Orders
 *   description: API quản lý đơn hàng nghề nghiệp cho trường học
 */

/**
 * @swagger
 * /api/v1/school-manage/career-orders/approved:
 *   get:
 *     summary: Lấy danh sách đơn hàng đã duyệt của trường
 *     tags: [School - Career Orders]
 *     parameters:
 *       - in: query
 *         name: school_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trường (bắt buộc)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
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
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Trường sắp xếp
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                   example: Get approved orders successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       order_code:
 *                         type: integer
 *                         example: 1001
 *                         description: Mã đơn hàng
 *                       note:
 *                         type: string
 *                         example: "Đơn hàng tháng 11"
 *                         description: Ghi chú đơn hàng
 *                       creator:
 *                         type: object
 *                         description: Thông tin người tạo đơn
 *                         properties:
 *                           full_name:
 *                             type: string
 *                             example: "Nguyễn Văn A"
 *                           email:
 *                             type: string
 *                             example: "admin@example.com"
 *                       reviewer:
 *                         type: object
 *                         description: Thông tin người duyệt đơn
 *                         properties:
 *                           full_name:
 *                             type: string
 *                             example: "Trần Thị B"
 *                           email:
 *                             type: string
 *                             example: "reviewer@example.com"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-15T08:00:00Z"
 *                         description: Thời gian tạo đơn
 *                       reviewed_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-16T10:00:00Z"
 *                         description: Thời gian duyệt đơn
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
 *         description: Thiếu school_id
 *       404:
 *         description: Không tìm thấy trường
 *       500:
 *         description: Lỗi server
 */
router.get("/approved", careerController.getApprovedOrdersBySchool);

/**
 * @swagger
 * /api/v1/school-manage/careers/active:
 *   get:
 *     summary: Lấy danh sách nghề đã kích hoạt của trường
 *     description: |
 *       Lấy danh sách các nghề mà trường học đang có license kích hoạt.
 *       Quy tắc:
 *       - Chỉ lấy nghề có is_active = true
 *       - Chỉ lấy license có status = ACTIVE
 *       - Nếu có nhiều license cho cùng một nghề, lấy license có expiry_date muộn nhất
 *     tags: [School - Career Orders]
 *     parameters:
 *       - in: query
 *         name: school_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trường (bắt buộc)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
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
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Trường sắp xếp (created_at, name, code, updated_at)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                   example: Get active careers successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "550e8400-e29b-41d4-a716-446655440001"
 *                         description: ID nghề
 *                       code:
 *                         type: string
 *                         example: "IT001"
 *                         description: Mã nghề
 *                       name:
 *                         type: string
 *                         example: "Lập trình viên"
 *                         description: Tên nghề
 *                       description:
 *                         type: string
 *                         example: "Nghề lập trình phần mềm"
 *                         description: Mô tả nghề
 *                       tags:
 *                         type: string
 *                         example: "IT,Programming,Software"
 *                         description: Tags của nghề
 *                       is_active:
 *                         type: boolean
 *                         example: true
 *                         description: Trạng thái hoạt động
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-01T08:00:00Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-15T10:00:00Z"
 *                       thumbnail_url:
 *                         type: string
 *                         nullable: true
 *                         example: "https://minio.example.com/bucket/thumb.jpg"
 *                         description: URL ảnh thumbnail của nghề (từ tiêu chí đầu tiên)
 *                       license:
 *                         type: object
 *                         description: Thông tin license của nghề (license có expiry_date muộn nhất)
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "650e8400-e29b-41d4-a716-446655440002"
 *                             description: ID license
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-01T00:00:00Z"
 *                             description: Ngày bắt đầu
 *                           expiry_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-01T00:00:00Z"
 *                             description: Ngày hết hạn
 *                           status:
 *                             type: string
 *                             example: "ACTIVE"
 *                             description: Trạng thái license
 *                           order_id:
 *                             type: string
 *                             example: "750e8400-e29b-41d4-a716-446655440003"
 *                             description: ID đơn hàng liên quan
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                       description: Tổng số nghề
 *                     page:
 *                       type: integer
 *                       example: 1
 *                       description: Trang hiện tại
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                       description: Số bản ghi mỗi trang
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                       description: Tổng số trang
 *       400:
 *         description: Thiếu school_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: school_id is required
 *       404:
 *         description: Không tìm thấy trường
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: School not found
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error message
 */
router.get("/active", careerController.getActiveCareersForSchool);

module.exports = router;
