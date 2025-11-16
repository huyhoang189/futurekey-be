# Users API Testing Guide

## Base URL

```
http://localhost:8080/api/v1/system-admin/users
```

## Endpoints

### 1. GET - Lấy danh sách users

```bash
GET /api/v1/system-admin/users?page=1&limit=10
```

**Query Parameters:**

- `page` (integer, optional): Số trang, default = 1
- `limit` (integer, optional): Số items mỗi trang, default = 10, max = 1000
- `search` (string, optional): Tìm kiếm theo username, full_name, email, phone
- `status` (string, optional): Lọc theo trạng thái (ACTIVE, INACTIVE, BANNER)
- `group_id` (string, optional): Lọc theo group ID

**Example:**

```bash
# Lấy trang 1, 10 items
curl http://localhost:8080/api/v1/system-admin/users?page=1&limit=10

# Tìm kiếm user có tên "john"
curl http://localhost:8080/api/v1/system-admin/users?search=john

# Lọc user ACTIVE
curl http://localhost:8080/api/v1/system-admin/users?status=ACTIVE
```

**Response:**

```json
{
  "success": true,
  "message": "Get all users successfully",
  "data": [...],
  "meta": {
    "total": 100,
    "skip": 0,
    "limit": 10,
    "page": 1
  }
}
```

---

### 2. POST - Tạo mới user

```bash
POST /api/v1/system-admin/users
```

**Body (JSON):**

```json
{
  "user_name": "johndoe", // Required
  "email": "john@example.com", // Required
  "full_name": "John Doe", // Optional
  "phone_number": "0123456789", // Optional
  "address": "123 Street", // Optional
  "description": "User info", // Optional
  "group_id": "group-123", // Optional
  "password": "password123" // Optional (sẽ dùng default nếu không truyền)
}
```

**Example:**

```bash
curl -X POST http://localhost:8080/api/v1/system-admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone_number": "0123456789"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Create user successfully",
  "data": {
    "id": "abc-123",
    "user_name": "johndoe",
    "email": "john@example.com",
    ...
  }
}
```

---

### 3. PUT - Cập nhật profile user

```bash
PUT /api/v1/system-admin/users/:id
```

**Body (JSON):**

```json
{
  "user_name": "johndoe_updated",
  "full_name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone_number": "0987654321",
  "address": "456 New Street",
  "description": "Updated info",
  "group_id": "new-group-id"
}
```

**Example:**

```bash
curl -X PUT http://localhost:8080/api/v1/system-admin/users/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe Updated",
    "phone_number": "0987654321"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Update user successfully",
  "data": {
    "id": "abc-123",
    "full_name": "John Doe Updated",
    ...
  }
}
```

---

### 4. DELETE - Xóa vĩnh viễn user

```bash
DELETE /api/v1/system-admin/users/:id
```

**Example:**

```bash
curl -X DELETE http://localhost:8080/api/v1/system-admin/users/abc-123
```

**Response:**

```json
{
  "success": true,
  "message": "User deleted permanently"
}
```

---

## Swagger Documentation

Truy cập Swagger UI để test API trực tiếp:

```
http://localhost:8080/api-docs
```

---

## Error Responses

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Username is required"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "User not found"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## Notes

- Tất cả các endpoint đều có pagination middleware tự động
- Email và username phải unique khi tạo mới
- Khi update, email và username cũng phải unique (trừ user hiện tại)
- Password không được trả về trong response
- Xóa user sẽ xóa cả refresh tokens liên quan
