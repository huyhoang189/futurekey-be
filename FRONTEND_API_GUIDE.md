# 📘 HƯỚNG DẪN CALL API EXAMS - CHO FRONTEND

## ✅ ĐÃ SỬA SWAGGER ĐÚNG

File `src/apis/v2/routes/schools/exams.routes.js` đã được cập nhật với Swagger documentation **CHÍNH XÁC**.

---

## 🚀 QUICK START - TẠO ĐỀ THI

### Bước 1: Lấy dữ liệu cần thiết

```sql
-- Lấy class_id
SELECT id, name FROM classes LIMIT 5;

-- Lấy category_id
SELECT id, name FROM question_categories WHERE is_active = true LIMIT 10;

-- Lấy career_criteria_id (optional)
SELECT id, name FROM career_criterias WHERE is_active = true LIMIT 5;
```

### Bước 2: Call API

**Endpoint:** `POST /api/v2/schools/exams`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Body (copy trực tiếp):**
```json
{
  "title": "Kiểm tra Lập trình - Giữa kỳ 1",
  "description": "Đề thi giữa kỳ 1 môn Lập trình căn bản",
  "class_id": "THAY_BẰNG_CLASS_ID_THỰC",
  "exam_type": "MIDTERM",
  "duration_minutes": 90,
  "total_points": 10,
  "passing_score": 5,
  "instructions": "- Làm bài trong 90 phút\n- Không được sử dụng tài liệu\n- Không được trao đổi với bạn bè\n- Khi hết giờ hệ thống tự động nộp bài",
  "is_shuffle_questions": true,
  "is_shuffle_options": true,
  "show_results_immediately": false,
  "max_attempts": 1,
  "start_time": "2024-12-10T08:00:00.000Z",
  "end_time": "2024-12-15T17:00:00.000Z",
  "is_published": false,
  "distributions": [
    {
      "category_id": "THAY_BẰNG_CATEGORY_ID_1",
      "career_criteria_id": null,
      "question_type": "MULTIPLE_CHOICE",
      "difficulty_level": null,
      "quantity": 15,
      "easy_count": 6,
      "medium_count": 7,
      "hard_count": 2,
      "points_per_question": 0.5,
      "order_index": 1
    },
    {
      "category_id": "THAY_BẰNG_CATEGORY_ID_2",
      "career_criteria_id": null,
      "question_type": "ESSAY",
      "difficulty_level": "HARD",
      "quantity": 1,
      "easy_count": 0,
      "medium_count": 0,
      "hard_count": 1,
      "points_per_question": 2.5,
      "order_index": 2
    }
  ]
}
```

---

## ⚠️ LƯU Ý QUAN TRỌNG - FIELD NAMES

### ✅ TÊN FIELD ĐÚNG (PHẢI DÙNG)

| Field Name API | Mô tả |
|---------------|-------|
| `total_points` | Tổng điểm đề thi |
| `is_shuffle_questions` | Xáo trộn câu hỏi |
| `is_shuffle_options` | Xáo trộn đáp án |
| `class_id` | **BẮT BUỘC** - ID lớp học |
| `instructions` | Hướng dẫn làm bài |
| `distributions` | **QUAN TRỌNG** - Cấu hình random câu hỏi |

### ❌ TÊN FIELD SAI (KHÔNG TỒN TẠI)

| Field Name SAI | Lý do |
|---------------|-------|
| `total_score` ❌ | Phải dùng `total_points` |
| `shuffle_questions` ❌ | Phải dùng `is_shuffle_questions` |
| `shuffle_options` ❌ | Phải dùng `is_shuffle_options` |
| `exam_code` ❌ | API không nhận field này |
| `is_active` ❌ | API không nhận field này |

---

## 📋 FIELD BẮT BUỘC

Khi tạo đề thi, **BẮT BUỘC** phải có 5 fields:

```json
{
  "title": "Tên đề thi",
  "class_id": "uuid-của-lớp-học",
  "exam_type": "MIDTERM",
  "duration_minutes": 90,
  "total_points": 10
}
```

---

## 🎯 DISTRIBUTIONS - QUAN TRỌNG NHẤT

**Nếu không có `distributions` → Đề thi sẽ RỖNG (không có câu hỏi)**

### Cấu trúc distributions:

```json
{
  "distributions": [
    {
      "category_id": "uuid",           // BẮT BUỘC - ID danh mục câu hỏi
      "career_criteria_id": null,       // Optional - Lọc theo tiêu chí nghề
      "question_type": "MULTIPLE_CHOICE", // MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ESSAY
      "difficulty_level": null,         // EASY | MEDIUM | HARD (hoặc null để lấy hỗn hợp)
      "quantity": 15,                   // BẮT BUỘC - Tổng số câu
      "easy_count": 6,                  // Số câu dễ
      "medium_count": 7,                // Số câu trung bình
      "hard_count": 2,                  // Số câu khó
      "points_per_question": 0.5,       // BẮT BUỘC - Điểm mỗi câu
      "order_index": 1                  // BẮT BUỘC - Thứ tự phần thi
    }
  ]
}
```

**Lưu ý:**
- `easy_count + medium_count + hard_count` PHẢI BẰNG `quantity`
- `order_index` quyết định thứ tự hiển thị (1, 2, 3...)
- Nếu set `difficulty_level: "EASY"` thì chỉ lấy câu dễ, bỏ qua `easy_count`, `medium_count`, `hard_count`

---

## 📚 SAMPLES SẴN SÀNG

Xem file: `sample-data/exams-create-correct.json`

Có 4 mẫu:
1. **sample_1**: Đề thi giữa kỳ (15 trắc nghiệm + 1 tự luận)
2. **sample_2**: Bài luyện tập (10 trắc nghiệm + 10 đúng/sai)
3. **sample_3**: Thi cuối kỳ (25 trắc nghiệm + 3 tự luận ngắn + 1 tự luận dài)
4. **sample_4**: Đề tối thiểu (chỉ 5 field bắt buộc)

---

## 🌐 SWAGGER UI

Xem chi tiết tại: `http://localhost:8080/api-docs/?urls.primaryName=API+v2`

Swagger đã được cập nhật với:
- ✅ Tên field đúng 100%
- ✅ Schema `ExamDistribution` đầy đủ
- ✅ 3 examples: Midterm, Practice, Minimal
- ✅ Mô tả chi tiết từng field

---

## 🔍 KIỂM TRA API ĐÃ ĐÚNG CHƯA

### Test bằng cURL:

```bash
curl -X POST http://localhost:8080/api/v2/schools/exams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test API",
    "class_id": "YOUR_CLASS_ID",
    "exam_type": "QUIZ",
    "duration_minutes": 30,
    "total_points": 10
  }'
```

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "id": "exam-uuid-here",
    "title": "Test API",
    "created_at": "2024-12-02T..."
  }
}
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Class not found"
→ `class_id` không tồn tại trong database
→ Chạy query `SELECT id FROM classes LIMIT 5;` để lấy ID đúng

### Lỗi: "Invalid input data"
→ Kiểm tra:
- Có đủ 5 field bắt buộc không?
- `exam_type` có đúng enum không? (PRACTICE, QUIZ, MIDTERM, FINAL, MOCK_TEST)
- `distributions` có đúng format không?

### Đề thi tạo xong nhưng không có câu hỏi
→ Thiếu `distributions` hoặc `distributions` rỗng
→ Phải thêm ít nhất 1 distribution

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Kiểm tra Swagger UI
2. Xem file `sample-data/exams-create-correct.json`
3. Xem log server: `npm run dev`
4. Liên hệ Backend team

**File đã cập nhật:**
- ✅ `src/apis/v2/routes/schools/exams.routes.js` - Swagger đã sửa
- ✅ `src/apis/v2/services/schools/exams.service.js` - Đã fix bug distributions
- ✅ `sample-data/exams-create-correct.json` - Sample data đúng

**Last updated:** December 2, 2024
