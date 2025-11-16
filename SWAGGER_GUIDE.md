# Hướng dẫn sử dụng Swagger

## Truy cập Swagger UI

Sau khi chạy server, bạn có thể truy cập Swagger UI tại:

```
http://localhost:3000/api-docs
```

## Cách viết Swagger annotations

### 1. Định nghĩa Tag (nhóm API)

```javascript
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý người dùng
 */
```

### 2. GET endpoint đơn giản

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Thành công
 */
```

### 3. GET với parameters

```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy chi tiết user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
```

### 4. POST với request body

```javascript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo user mới
 *     tags: [Users]
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
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
```

### 5. Endpoint có authentication

```javascript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo user mới
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 */
```

### 6. Định nghĩa Schema tái sử dụng

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 */
```

Sau đó sử dụng:

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
```

## Lưu ý

1. Đặt annotations ngay phía trên định nghĩa route trong file routes
2. Mỗi khi thêm/sửa annotations, server sẽ tự động cập nhật (nếu dùng nodemon)
3. Xem file `swagger-examples.js` để có thêm ví dụ chi tiết
4. Để test API có authentication, nhấn nút "Authorize" trên Swagger UI và nhập JWT token

## Cấu hình

Cấu hình Swagger nằm trong file `src/configs/swagger.js`:

- Có thể thay đổi title, version, description
- Thêm/bớt servers
- Cấu hình security schemes
