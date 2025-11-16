/**
 * @swagger
 * tags:
 *   name: Example
 *   description: API endpoints ví dụ
 */

/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Lấy danh sách ví dụ
 *     tags: [Example]
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
 *         description: Số lượng item mỗi trang
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /api/example/{id}:
 *   get:
 *     summary: Lấy chi tiết một item
 *     tags: [Example]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của item
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
 *                 data:
 *                   type: object
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /api/example:
 *   post:
 *     summary: Tạo mới item
 *     tags: [Example]
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
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: 0123456789
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /api/example/{id}:
 *   put:
 *     summary: Cập nhật item
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /api/example/{id}:
 *   delete:
 *     summary: Xóa item
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của item
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */

// Ví dụ về Component Schema (có thể tái sử dụng)
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: ID tự động sinh
 *         email:
 *           type: string
 *           format: email
 *           description: Email của user
 *         name:
 *           type: string
 *           description: Tên của user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo
 *       example:
 *         id: "abc123"
 *         email: user@example.com
 *         name: Nguyễn Văn A
 *         createdAt: 2025-10-30T10:00:00.000Z
 */
