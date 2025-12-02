# 📚 HƯỚNG DẪN API - HỆ THỐNG ĐỀ THI E-LEARNING

## 🎯 Tổng quan

Tài liệu này hướng dẫn Frontend sử dụng các API để xây dựng hệ thống quản lý câu hỏi và đề thi.

**Base URL:** `http://localhost:8080/api/v2`

**Authentication:** Tất cả API yêu cầu header:
```
Authorization: Bearer {access_token}
```

---

## 📋 MỤC LỤC

1. [Quản lý Danh mục Câu hỏi](#1-quản-lý-danh-mục-câu-hỏi)
2. [Quản lý Câu hỏi](#2-quản-lý-câu-hỏi)
3. [Quản lý Đề thi](#3-quản-lý-đề-thi)
4. [Học sinh làm bài](#4-học-sinh-làm-bài)
5. [Chấm điểm & Xem kết quả](#5-chấm-điểm--xem-kết-quả)

---

## 1. QUẢN LÝ DANH MỤC CÂU HỎI

### 1.1. Lấy danh sách danh mục

**Endpoint:** `GET /schools/question-categories`

**Query params:**
```javascript
{
  page: 1,
  limit: 20,
  search: "Toán học",
  parent_id: null,  // Lấy danh mục cha
  is_active: true
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "494aa72f-cf32-11f0-afc5-2626c197d041",
      "name": "Lập trình",
      "description": "Danh mục câu hỏi lập trình",
      "parent_id": null,
      "order_index": 1,
      "is_active": true,
      "created_at": "2024-12-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "skip": 0,
    "limit": 20
  }
}
```

### 1.2. Tạo danh mục mới

**Endpoint:** `POST /schools/question-categories`

**Body:**
```json
{
  "name": "Cơ sở dữ liệu",
  "description": "Câu hỏi về SQL, NoSQL, Database Design",
  "parent_id": null,
  "order_index": 2,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "56d87ee2-cf32-11f0-afc5-2626c197d041",
    "name": "Cơ sở dữ liệu",
    ...
  }
}
```

### 1.3. Cập nhật danh mục

**Endpoint:** `PUT /schools/question-categories/{id}`

**Body:** (Các field optional)
```json
{
  "name": "Database & SQL",
  "description": "Updated description",
  "is_active": false
}
```

### 1.4. Xóa danh mục

**Endpoint:** `DELETE /schools/question-categories/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Question category deleted successfully"
}
```

---

## 2. QUẢN LÝ CÂU HỎI

### 2.1. Lấy danh sách câu hỏi

**Endpoint:** `GET /schools/questions`

**Query params:**
```javascript
{
  page: 1,
  limit: 20,
  search: "SELECT",
  category_id: "56d87ee2-cf32-11f0-afc5-2626c197d041",
  career_criteria_id: "09352b7e-c88e-11f0-afc5-2626c197d041",
  question_type: "MULTIPLE_CHOICE",  // MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ESSAY
  difficulty_level: "MEDIUM",         // EASY | MEDIUM | HARD
  is_active: true
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "q-001",
      "category_id": "56d87ee2-cf32-11f0-afc5-2626c197d041",
      "category": {
        "id": "56d87ee2-cf32-11f0-afc5-2626c197d041",
        "name": "Cơ sở dữ liệu"
      },
      "career_criteria_id": "09352b7e-c88e-11f0-afc5-2626c197d041",
      "question_type": "MULTIPLE_CHOICE",
      "difficulty_level": "MEDIUM",
      "content": "Câu lệnh SQL nào dùng để lấy dữ liệu?",
      "points": 1.00,
      "time_limit": 60,
      "tags": "sql,select,database",
      "usage_count": 5,
      "is_active": true,
      "created_at": "2024-12-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "skip": 0,
    "limit": 20
  }
}
```

### 2.2. Lấy chi tiết câu hỏi

**Endpoint:** `GET /schools/questions/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "q-001",
    "content": "Câu lệnh SQL nào dùng để lấy dữ liệu?",
    "question_type": "MULTIPLE_CHOICE",
    "difficulty_level": "MEDIUM",
    "options": [
      {
        "id": "opt-001",
        "option_key": "A",
        "option_text": "SELECT",
        "is_correct": true,
        "order_index": 0
      },
      {
        "id": "opt-002",
        "option_key": "B",
        "option_text": "INSERT",
        "is_correct": false,
        "order_index": 1
      },
      {
        "id": "opt-003",
        "option_key": "C",
        "option_text": "UPDATE",
        "is_correct": false,
        "order_index": 2
      },
      {
        "id": "opt-004",
        "option_key": "D",
        "option_text": "DELETE",
        "is_correct": false,
        "order_index": 3
      }
    ],
    "explanation": "SELECT được dùng để truy vấn dữ liệu từ database",
    "points": 1.00,
    "tags": "sql,select",
    "metadata": {
      "topic": "SQL Basics"
    }
  }
}
```

### 2.3. Tạo câu hỏi mới

**Endpoint:** `POST /schools/questions`

#### A. Câu hỏi TRẮC NGHIỆM (MULTIPLE_CHOICE)

**Body:**
```json
{
  "category_id": "56d87ee2-cf32-11f0-afc5-2626c197d041",
  "career_criteria_id": "09352b7e-c88e-11f0-afc5-2626c197d041",
  "question_type": "MULTIPLE_CHOICE",
  "difficulty_level": "MEDIUM",
  "content": "Câu lệnh SQL nào dùng để lấy dữ liệu?",
  "options": [
    {
      "option_key": "A",
      "option_text": "SELECT",
      "is_correct": true,
      "order_index": 0
    },
    {
      "option_key": "B",
      "option_text": "INSERT",
      "is_correct": false,
      "order_index": 1
    },
    {
      "option_key": "C",
      "option_text": "UPDATE",
      "is_correct": false,
      "order_index": 2
    },
    {
      "option_key": "D",
      "option_text": "DELETE",
      "is_correct": false,
      "order_index": 3
    }
  ],
  "explanation": "SELECT được dùng để truy vấn dữ liệu",
  "points": 1,
  "time_limit": 60,
  "tags": "sql,select,database",
  "metadata": {
    "topic": "SQL Basics"
  },
  "is_active": true
}
```

#### B. Câu hỏi ĐÚNG/SAI (TRUE_FALSE)

**Body:**
```json
{
  "category_id": "56d87ee2-cf32-11f0-afc5-2626c197d041",
  "question_type": "TRUE_FALSE",
  "difficulty_level": "EASY",
  "content": "SQL là ngôn ngữ lập trình hướng đối tượng.",
  "correct_answer": "false",
  "options": [
    {
      "option_key": "TRUE",
      "option_text": "Đúng",
      "is_correct": false,
      "order_index": 0
    },
    {
      "option_key": "FALSE",
      "option_text": "Sai",
      "is_correct": true,
      "order_index": 1
    }
  ],
  "explanation": "SQL là ngôn ngữ truy vấn, không phải OOP",
  "points": 1,
  "is_active": true
}
```

#### C. Câu hỏi TỰ LUẬN NGẮN (SHORT_ANSWER)

**Body:**
```json
{
  "category_id": "6a2fdf84-cf32-11f0-afc5-2626c197d041",
  "question_type": "SHORT_ANSWER",
  "difficulty_level": "MEDIUM",
  "content": "Độ phức tạp của thuật toán Binary Search là gì?",
  "correct_answer": "O(log n)",
  "explanation": "Binary Search có độ phức tạp O(log n)",
  "points": 2,
  "metadata": {
    "expected_keywords": ["O(log n)", "logarit"],
    "max_length": 100
  },
  "is_active": true
}
```

#### D. Câu hỏi TỰ LUẬN DÀI (ESSAY)

**Body:**
```json
{
  "category_id": "494aa72f-cf32-11f0-afc5-2626c197d041",
  "question_type": "ESSAY",
  "difficulty_level": "HARD",
  "content": "Giải thích khái niệm Polymorphism trong OOP",
  "explanation": "Polymorphism cho phép các đối tượng khác nhau xử lý thông qua cùng interface",
  "points": 5,
  "metadata": {
    "min_words": 100,
    "grading_rubric": {
      "definition": 2,
      "example": 2,
      "explanation": 1
    }
  },
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "q-new-001",
    "content": "...",
    "created_by": "teacher-id-auto-filled",
    "created_at": "2024-12-01T10:30:00.000Z"
  }
}
```

### 2.4. Cập nhật câu hỏi

**Endpoint:** `PUT /schools/questions/{id}`

**Body:** (Các field optional)
```json
{
  "content": "Updated question content",
  "difficulty_level": "HARD",
  "points": 2,
  "is_active": false
}
```

### 2.5. Xóa câu hỏi

**Endpoint:** `DELETE /schools/questions/{id}`

**Lưu ý:** Không thể xóa nếu câu hỏi đang được dùng trong đề thi.

**Response:**
```json
{
  "success": false,
  "message": "Cannot delete question. It is being used in exams"
}
```

---

## 3. QUẢN LÝ ĐỀ THI

### 3.1. Lấy danh sách đề thi

**Endpoint:** `GET /schools/exams`

**Query params:**
```javascript
{
  page: 1,
  limit: 20,
  search: "Giữa kỳ",
  class_id: "class-001",
  exam_type: "MIDTERM",  // PRACTICE | QUIZ | MIDTERM | FINAL | MOCK_TEST
  is_published: true
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exam-001",
      "title": "Kiểm tra Toán 10 - Giữa kỳ 1",
      "exam_code": "TOAN10-GK1-2024",
      "description": "Đề thi giữa kỳ 1",
      "class_id": "class-001",
      "class": {
        "id": "class-001",
        "name": "10A1"
      },
      "exam_type": "MIDTERM",
      "duration_minutes": 90,
      "total_points": 10.00,
      "passing_score": 5.00,
      "is_shuffle_questions": true,
      "is_shuffle_options": true,
      "show_results_immediately": false,
      "max_attempts": 1,
      "start_time": "2024-12-01T08:00:00.000Z",
      "end_time": "2024-12-05T17:00:00.000Z",
      "is_published": true,
      "created_by": "teacher-001",
      "creator": {
        "id": "teacher-001",
        "full_name": "Nguyễn Văn A"
      },
      "created_at": "2024-11-25T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "skip": 0,
    "limit": 20
  }
}
```

### 3.2. Lấy chi tiết đề thi

**Endpoint:** `GET /schools/exams/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "exam-001",
    "title": "Kiểm tra Toán 10 - Giữa kỳ 1",
    "exam_code": "TOAN10-GK1-2024",
    "duration_minutes": 90,
    "total_points": 10.00,
    "passing_score": 5.00,
    "instructions": "- Làm bài trong 90 phút\n- Không được sử dụng tài liệu",
    "is_shuffle_questions": true,
    "is_shuffle_options": true,
    "max_attempts": 1,
    "start_time": "2024-12-01T08:00:00.000Z",
    "end_time": "2024-12-05T17:00:00.000Z",
    "is_published": true,
    "distributions": [
      {
        "id": "dist-001",
        "exam_id": "exam-001",
        "category_id": "494aa72f-cf32-11f0-afc5-2626c197d041",
        "question_type": "MULTIPLE_CHOICE",
        "difficulty_level": null,
        "quantity": 10,
        "easy_count": 3,
        "medium_count": 5,
        "hard_count": 2,
        "points_per_question": 0.50,
        "order_index": 1
      }
    ],
    "exam_questions": [
      {
        "id": "eq-001",
        "exam_id": "exam-001",
        "question_id": "q-001",
        "order_index": 1,
        "points": 0.50
      }
    ]
  }
}
```

### 3.3. Tạo đề thi mới

**Endpoint:** `POST /schools/exams`

#### A. Tạo đề với CẤU HÌNH RANDOM (Khuyến nghị)

**Body:**
```json
{
  "title": "Kiểm tra Lập trình - Cuối kỳ",
  "description": "Đề thi cuối kỳ môn Lập trình",
  "class_id": "class-001",
  "exam_type": "FINAL",
  "duration_minutes": 120,
  "total_points": 10,
  "passing_score": 5,
  "instructions": "- Làm bài trong 120 phút\n- Không tra tài liệu",
  "is_shuffle_questions": true,
  "is_shuffle_options": true,
  "show_results_immediately": false,
  "max_attempts": 1,
  "start_time": "2024-12-10T08:00:00.000Z",
  "end_time": "2024-12-15T17:00:00.000Z",
  "is_published": false,
  "distributions": [
    {
      "category_id": "494aa72f-cf32-11f0-afc5-2626c197d041",
      "question_type": "MULTIPLE_CHOICE",
      "quantity": 15,
      "easy_count": 5,
      "medium_count": 7,
      "hard_count": 3,
      "points_per_question": 0.5,
      "order_index": 1
    },
    {
      "category_id": "56d87ee2-cf32-11f0-afc5-2626c197d041",
      "question_type": "MULTIPLE_CHOICE",
      "quantity": 10,
      "easy_count": 3,
      "medium_count": 5,
      "hard_count": 2,
      "points_per_question": 0.5,
      "order_index": 2
    },
    {
      "category_id": "494aa72f-cf32-11f0-afc5-2626c197d041",
      "question_type": "ESSAY",
      "difficulty_level": "HARD",
      "quantity": 2,
      "points_per_question": 2.5,
      "order_index": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "exam-new-001",
    "title": "Kiểm tra Lập trình - Cuối kỳ",
    "created_by": "teacher-id-auto-filled",
    "created_at": "2024-12-01T11:00:00.000Z"
  }
}
```

### 3.4. Cập nhật thông tin đề thi

**Endpoint:** `PUT /schools/exams/{id}`

**Body:** (Các field optional)
```json
{
  "title": "Updated title",
  "duration_minutes": 150,
  "is_published": true,
  "start_time": "2024-12-15T08:00:00.000Z"
}
```

### 3.5. Cập nhật cấu hình random (distributions)

**Endpoint:** `PUT /schools/exams/{id}/distributions`

**Body:**
```json
{
  "distributions": [
    {
      "category_id": "494aa72f-cf32-11f0-afc5-2626c197d041",
      "quantity": 20,
      "easy_count": 8,
      "medium_count": 10,
      "hard_count": 2,
      "points_per_question": 0.5,
      "order_index": 1
    }
  ]
}
```

**Lưu ý:** Không thể cập nhật nếu đã có học sinh làm bài.

### 3.6. Generate câu hỏi cho đề thi (từ distributions)

**Endpoint:** `POST /schools/exams/{id}/generate-questions`

**Response:**
```json
{
  "success": true,
  "message": "Generated 27 questions for exam",
  "data": {
    "count": 27
  }
}
```

**Giải thích:**
- API này sẽ random câu hỏi dựa trên cấu hình `distributions`
- Lưu vào bảng `exam_questions` để giáo viên preview
- Chỉ có thể generate 1 lần (nếu muốn generate lại phải xóa câu hỏi cũ)

### 3.7. Xóa đề thi

**Endpoint:** `DELETE /schools/exams/{id}`

**Lưu ý:** Không thể xóa nếu đã có học sinh làm bài.

**Response:**
```json
{
  "success": false,
  "message": "Cannot delete exam. Students have already attempted it"
}
```

---

## 4. HỌC SINH LÀM BÀI

### 4.1. Bắt đầu làm bài

**Endpoint:** `POST /students/exams/{examId}/start`

**Body:** Không cần (studentId tự động lấy từ token)

**Response:**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "attempt-001",
      "student_id": "student-123",
      "exam_id": "exam-001",
      "start_time": "2024-12-01T10:00:00.000Z",
      "max_score": 10.00,
      "status": "IN_PROGRESS",
      "snapshot_data": {
        "questions": [...],
        "exam_settings": {
          "is_shuffle_questions": true,
          "is_shuffle_options": true,
          "show_results_immediately": false
        }
      }
    },
    "questions": [
      {
        "id": "q-001",
        "order": 1,
        "points": 0.5,
        "content": "Câu lệnh SQL nào dùng để lấy dữ liệu?",
        "question_type": "MULTIPLE_CHOICE",
        "explanation": "SELECT dùng để query data",
        "options": [
          {
            "key": "A",
            "text": "SELECT",
            "is_correct": true
          },
          {
            "key": "B",
            "text": "INSERT",
            "is_correct": false
          }
        ]
      }
    ]
  }
}
```

**Lưu ý:**
- Nếu đã có attempt đang IN_PROGRESS → Trả về attempt cũ
- Questions đã được shuffle theo cấu hình exam
- Snapshot lưu đầy đủ thông tin để độc lập với database

### 4.2. Lưu câu trả lời (auto-save)

**Endpoint:** `POST /students/exams/attempts/{attemptId}/answers`

**Body:**

#### A. Trả lời TRẮC NGHIỆM (MULTIPLE_CHOICE)
```json
{
  "question_id": "q-001",
  "answer_data": {
    "selected": ["A"]
  }
}
```

#### B. Trả lời ĐÚNG/SAI (TRUE_FALSE)
```json
{
  "question_id": "q-002",
  "answer_data": {
    "value": true
  }
}
```

#### C. Trả lời TỰ LUẬN (SHORT_ANSWER/ESSAY)
```json
{
  "question_id": "q-003",
  "answer_data": {
    "text": "Đáp án tự luận của học sinh..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ans-001",
    "attempt_id": "attempt-001",
    "question_id": "q-001",
    "answer_data": {
      "selected": ["A"]
    },
    "created_at": "2024-12-01T10:05:00.000Z"
  }
}
```

**Lưu ý:**
- Gọi API này mỗi khi học sinh chọn/thay đổi đáp án
- Hệ thống tự động upsert (tạo mới hoặc cập nhật)

### 4.3. Nộp bài

**Endpoint:** `POST /students/exams/attempts/{attemptId}/submit`

**Body:** Không cần

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Exam submitted successfully",
    "duration_seconds": 4500
  }
}
```

**Lưu ý:**
- Hệ thống tự động chấm trắc nghiệm ngay sau khi nộp
- Câu tự luận sẽ chờ giáo viên chấm

### 4.4. Xem kết quả bài thi

**Endpoint:** `GET /students/exams/attempts/{attemptId}/results`

**Response:**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "attempt-001",
      "start_time": "2024-12-01T10:00:00.000Z",
      "submit_time": "2024-12-01T11:15:00.000Z",
      "duration_seconds": 4500,
      "status": "GRADED",
      "total_score": 8.50,
      "max_score": 10.00
    },
    "exam": {
      "title": "Kiểm tra Toán 10 - Giữa kỳ 1",
      "exam_code": "TOAN10-GK1-2024"
    },
    "summary": {
      "total_score": 8.50,
      "max_score": 10.00,
      "duration_seconds": 4500,
      "correct_count": 17,
      "total_questions": 20,
      "status": "GRADED"
    },
    "detailed_answers": [
      {
        "question_id": "q-001",
        "question_content": "Câu lệnh SQL nào dùng để lấy dữ liệu?",
        "question_type": "MULTIPLE_CHOICE",
        "category": {
          "id": "cat-001",
          "name": "Cơ sở dữ liệu"
        },
        "student_answer": {
          "selected": ["A"]
        },
        "is_correct": true,
        "score": 0.50,
        "max_score": 0.50,
        "explanation": "SELECT được dùng để truy vấn dữ liệu",
        "options": [
          {
            "key": "A",
            "text": "SELECT",
            "is_correct": true
          },
          {
            "key": "B",
            "text": "INSERT",
            "is_correct": false
          }
        ]
      }
    ],
    "category_statistics": {
      "Cơ sở dữ liệu": {
        "score": 4.50,
        "max_score": 5.00
      },
      "Lập trình": {
        "score": 4.00,
        "max_score": 5.00
      }
    }
  }
}
```

---

## 5. CHẤM ĐIỂM & XEM KẾT QUẢ (Dành cho Giáo viên)

### 5.1. Xem danh sách bài làm cần chấm

**Endpoint:** `GET /schools/exams-need-grading`

**Query params:**
```javascript
{
  page: 1,
  limit: 20,
  exam_id: "exam-001",
  status: "SUBMITTED"  // SUBMITTED | GRADED
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "attempt-001",
      "student_id": "student-123",
      "student": {
        "full_name": "Nguyễn Văn B",
        "student_code": "HS001"
      },
      "exam_id": "exam-001",
      "exam": {
        "title": "Kiểm tra Toán 10",
        "exam_code": "TOAN10-GK1"
      },
      "submit_time": "2024-12-01T11:00:00.000Z",
      "status": "SUBMITTED",
      "total_score": 6.50,
      "max_score": 10.00
    }
  ],
  "meta": {
    "total": 15,
    "skip": 0,
    "limit": 20
  }
}
```

### 5.2. Xem chi tiết bài làm để chấm

**Endpoint:** `GET /students/exams/attempts/{attemptId}/results`

(Sử dụng cùng API như học sinh xem kết quả ở mục 4.4)

### 5.3. Chấm điểm câu tự luận

**Endpoint:** `POST /schools/exams/attempts/{attemptId}/answers/{answerId}/grade`

**Body:**
```json
{
  "score": 2.0,
  "feedback": "Bài làm tốt, nhưng thiếu phần kết luận. Cần bổ sung thêm ví dụ minh họa."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Essay question graded successfully"
  }
}
```

**Lưu ý:**
- `graded_by` tự động lấy từ token (giáo viên đang chấm)
- Sau khi chấm xong tất cả câu → status tự động chuyển thành "GRADED"

---

## 📌 ENUMS & CONSTANTS

### Question Types
```javascript
{
  MULTIPLE_CHOICE: "Trắc nghiệm",
  TRUE_FALSE: "Đúng/Sai",
  SHORT_ANSWER: "Tự luận ngắn",
  ESSAY: "Tự luận dài"
}
```

### Question Difficulty
```javascript
{
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó"
}
```

### Exam Types
```javascript
{
  PRACTICE: "Luyện tập",
  QUIZ: "Kiểm tra nhỏ",
  MIDTERM: "Giữa kỳ",
  FINAL: "Cuối kỳ",
  MOCK_TEST: "Thi thử"
}
```

### Exam Attempt Status
```javascript
{
  IN_PROGRESS: "Đang làm",
  SUBMITTED: "Đã nộp",
  GRADED: "Đã chấm điểm"
}
```

---

## 🔒 ERROR HANDLING

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid input data"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "User is not associated with any school"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Question not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🎯 WORKFLOW TỔNG THỂ

### Workflow Giáo viên tạo đề thi

```
1. Tạo danh mục câu hỏi
   POST /schools/question-categories

2. Nhập câu hỏi vào ngân hàng
   POST /schools/questions (nhiều lần)

3. Tạo đề thi với cấu hình random
   POST /schools/exams (kèm distributions)

4. (Optional) Generate preview câu hỏi
   POST /schools/exams/{id}/generate-questions

5. Publish đề thi
   PUT /schools/exams/{id} → is_published: true
```

### Workflow Học sinh làm bài

```
1. Bắt đầu làm bài
   POST /students/exams/{examId}/start

2. Lưu câu trả lời (auto-save mỗi khi chọn đáp án)
   POST /students/exams/attempts/{attemptId}/answers

3. Nộp bài
   POST /students/exams/attempts/{attemptId}/submit

4. Xem kết quả
   GET /students/exams/attempts/{attemptId}/results
```

### Workflow Giáo viên chấm bài

```
1. Xem danh sách bài cần chấm
   GET /schools/exams-need-grading

2. Xem chi tiết bài làm
   GET /students/exams/attempts/{attemptId}/results

3. Chấm từng câu tự luận
   POST /schools/exams/attempts/{attemptId}/answers/{answerId}/grade

4. Xem kết quả đã chấm
   GET /students/exams/attempts/{attemptId}/results
```

---

## 📊 SAMPLE DATA FILES

Tham khảo file mẫu để test API:
- `/sample-data/question-categories-sample.json` - Danh mục câu hỏi
- `/sample-data/questions-sample.json` - 10 câu hỏi mẫu (các loại khác nhau)

---

## 🆘 SUPPORT

Nếu có vấn đề, vui lòng:
1. Kiểm tra Swagger documentation: `http://localhost:8080/api-docs/?urls.primaryName=API+v2`
2. Xem log server để debug
3. Liên hệ Backend team

---

**Last updated:** December 2, 2024
