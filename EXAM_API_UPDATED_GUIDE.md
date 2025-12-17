# 📚 Hướng dẫn API Bài Thi - Cập nhật mới nhất

## 🔄 Thay đổi quan trọng

### **ĐÃ BỎ `option_key`**
- ❌ **KHÔNG còn** field `option_key` ("A", "B", "C", "D") trong `question_options`
- ✅ FE **TỰ SINH** ABCD dựa trên `order_index`:
  - `order_index: 0` → Hiển thị **"A"**
  - `order_index: 1` → Hiển thị **"B"**  
  - `order_index: 2` → Hiển thị **"C"**
  - `order_index: 3` → Hiển thị **"D"**
- ✅ Student gửi **`question_option_id`** (UUID) thay vì "A"/"B"/"C"/"D"

---

## 📋 Quy trình làm bài thi

### **1. Bắt đầu làm bài**

```http
POST /api/v2/students/student-exams/start
```

**Request:**
```json
{
  "exam_type": "COMPREHENSIVE",
  "career_criteria_id": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "attempt-123",
      "status": "IN_PROGRESS",
      "start_time": "2025-12-17T10:00:00Z"
    },
    "questions": [
      {
        "question_id": "ques-456",
        "content": "Chu vi hình tròn bán kính 10cm là?",
        "question_type": "MULTIPLE_CHOICE",
        "points": 1,
        "options": [
          {
            "id": "opt-789-aaa",           // ← GỬI ID NÀY KHI SUBMIT
            "option_text": "62.8 cm",
            "order_index": 0                // ← FE hiển thị "A"
          },
          {
            "id": "opt-789-bbb",
            "option_text": "31.4 cm",  
            "order_index": 1                // ← FE hiển thị "B"
          },
          {
            "id": "opt-789-ccc",
            "option_text": "314 cm",
            "order_index": 2                // ← FE hiển thị "C"
          }
        ]
      }
    ]
  }
}
```

**snapshot_data (trong DB - không trả về cho student):**
```json
{
  "questions": [
    {
      "question_id": "ques-456",
      "correct_option_ids": ["opt-789-aaa"],  // ← Array các ID đáp án đúng
      "options": [...]
    }
  ]
}
```

---

### **2. FE hiển thị câu hỏi**

```jsx
function QuestionOption({ question }) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // Sort options theo order_index
  const sortedOptions = [...question.options].sort(
    (a, b) => (a.order_index ?? 999) - (b.order_index ?? 999)
  );

  return (
    <div>
      <h3>{question.content}</h3>
      {sortedOptions.map((option) => (
        <label key={option.id}>
          <input 
            type="radio" 
            name={question.question_id}
            value={option.id}  {/* ← LƯU UUID */}
          />
          <span>{labels[option.order_index]}. {option.option_text}</span>
        </label>
      ))}
    </div>
  );
}
```

---

### **3. Nộp bài thi**

```http
POST /api/v2/students/student-exams/attempts/{attemptId}/submit
```

**Request - Ví dụ 1: Câu hỏi 1 đáp án đúng**
```json
{
  "answers": [
    {
      "question_id": "ques-456",
      "answer_data": "opt-789-aaa"  // ← String UUID
    },
    {
      "question_id": "ques-789",
      "answer_data": "opt-111-bbb"
    }
  ]
}
```

**Request - Ví dụ 2: Câu hỏi NHIỀU đáp án đúng**
```json
{
  "answers": [
    {
      "question_id": "ques-multi-123",
      "answer_data": ["opt-aaa-111", "opt-bbb-222", "opt-ccc-333"]  // ← Array UUIDs
    }
  ]
}
```

**Request - Ví dụ 3: Hỗn hợp các loại**
```json
{
  "answers": [
    {
      "question_id": "ques-001",
      "answer_data": "opt-single-123"  // ← 1 đáp án
    },
    {
      "question_id": "ques-002", 
      "answer_data": ["opt-multi-1", "opt-multi-2"]  // ← Nhiều đáp án
    },
    {
      "question_id": "ques-003",
      "answer_data": "Đây là bài luận của học sinh..."  // ← Tự luận (text)
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "attempt-123",
      "status": "SUBMITTED",
      "submit_time": "2025-12-17T10:45:00Z",
      "duration_seconds": 2700,
      "is_auto_graded": true
    },
    "total_score": 8,
    "max_score": 10,
    "percentage": 80
  }
}
```

---

## 🎯 Logic chấm điểm

### **Câu MULTIPLE_CHOICE / TRUE_FALSE:**

**1 đáp án đúng:**
```javascript
// snapshot_data
correct_option_ids: ["opt-aaa-111"]

// Student submit
answer_data: "opt-aaa-111"  // ← String

// Backend check
["opt-aaa-111"] === ["opt-aaa-111"]  // ✅ Đúng → 1 điểm
```

**Nhiều đáp án đúng:**
```javascript
// snapshot_data
correct_option_ids: ["opt-1", "opt-2", "opt-3"]

// Student submit (cả 3 đáp án)
answer_data: ["opt-1", "opt-2", "opt-3"]  // ✅ Đúng → 1 điểm

// Student submit (thiếu 1 đáp án)
answer_data: ["opt-1", "opt-2"]  // ❌ Sai → 0 điểm

// Student submit (thừa 1 đáp án)
answer_data: ["opt-1", "opt-2", "opt-3", "opt-4"]  // ❌ Sai → 0 điểm

// Student submit (sai thứ tự - OK)
answer_data: ["opt-3", "opt-1", "opt-2"]  // ✅ Đúng → 1 điểm (tự động sort)
```

**Quy tắc:**
- Phải chọn **ĐÚNG HẾT** các đáp án đúng
- **KHÔNG ĐƯỢC** chọn thừa hoặc thiếu
- Thứ tự không quan trọng (backend tự sort)

### **Câu ESSAY / SHORT_ANSWER:**
```javascript
// Không chấm tự động
is_correct: null
score: null

// Giáo viên chấm sau
```

---

## 📤 Format `answer_data` theo loại câu hỏi

| Loại câu hỏi | Format | Ví dụ |
|-------------|--------|-------|
| **MULTIPLE_CHOICE** (1 đáp án) | `string` | `"opt-789-abc"` |
| **MULTIPLE_CHOICE** (nhiều đáp án) | `array` | `["opt-1", "opt-2", "opt-3"]` |
| **TRUE_FALSE** | `string` | `"opt-true-id"` |
| **ESSAY** | `string` | `"Bài luận dài..."` |
| **SHORT_ANSWER** | `string` | `"Câu trả lời ngắn"` |

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **KHÔNG làm:**
❌ Gửi `"A"`, `"B"`, `"C"`, `"D"`
```json
{
  "question_id": "ques-123",
  "answer_data": "A"  // ❌ SAI
}
```

❌ Gửi object phức tạp cho trắc nghiệm
```json
{
  "question_id": "ques-123",
  "answer_data": { "selected": "opt-123" }  // ❌ KHÔNG CẦN
}
```

### **NÊN làm:**
✅ Gửi UUID trực tiếp
```json
{
  "question_id": "ques-123",
  "answer_data": "opt-789-abc-def"  // ✅ ĐÚNG
}
```

✅ Nhiều đáp án → Array UUID
```json
{
  "question_id": "ques-456",
  "answer_data": ["opt-111-aaa", "opt-222-bbb"]  // ✅ ĐÚNG
}
```

---

## 🔧 Backward Compatible

Backend vẫn hỗ trợ format cũ (nếu FE chưa kịp update):

```json
// Cũ - Vẫn hoạt động
{
  "answer_data": {
    "option_id": "opt-123",
    "selected": ["opt-1", "opt-2"]
  }
}

// Mới - Recommended
{
  "answer_data": "opt-123"  // hoặc ["opt-1", "opt-2"]
}
```

---

## 📊 Migration Data

**Bảng `question_options` đã thay đổi:**
```sql
-- CŨ
CREATE TABLE question_options (
  id VARCHAR(36),
  question_id VARCHAR(36),
  option_key VARCHAR(10),  -- ← ĐÃ XÓA
  option_text TEXT,
  is_correct BOOLEAN,
  order_index INT
);

-- MỚI
CREATE TABLE question_options (
  id VARCHAR(36),
  question_id VARCHAR(36),
  option_text TEXT,
  is_correct BOOLEAN,
  order_index INT
);
```

**Snapshot_data format mới:**
```json
{
  "questions": [
    {
      "question_id": "uuid",
      "options": [...],
      "correct_option_ids": ["opt-1", "opt-2"]  // ← Array thay vì correct_answer
    }
  ]
}
```

---

## 🚀 Checklist cho FE

- [ ] Sort `options` theo `order_index` trước khi render
- [ ] Map `order_index` → ABCD (0=A, 1=B, 2=C, 3=D)
- [ ] Lưu `option.id` (UUID) khi user chọn
- [ ] Submit: 1 đáp án → String, nhiều đáp án → Array
- [ ] KHÔNG gửi "A", "B", "C", "D"
- [ ] Handle null/undefined `order_index` (sort về cuối)

---

## ❓ FAQ

**Q: Tại sao phải thay đổi?**  
A: Giảm dữ liệu trùng lặp, FE linh hoạt hơn (có thể đổi format hiển thị), backend chỉ cần lưu ID.

**Q: Có ảnh hưởng đến bài thi đang làm?**  
A: KHÔNG. Snapshot cũ vẫn hoạt động bình thường.

**Q: Nếu không sắp xếp theo `order_index`?**  
A: Vẫn hoạt động nhưng thứ tự ABCD sẽ sai. PHẢI sort trước khi hiển thị.

**Q: `order_index` có thể null?**  
A: CÓ THỂ. Nếu null, sort theo `created_at` hoặc để cuối danh sách.

**Q: Nhiều đáp án đúng - thiếu 1 đáp án có được nửa điểm không?**  
A: KHÔNG. Phải đúng 100% mới được điểm. All-or-nothing.

---

## 📞 Support

Nếu có vấn đề, liên hệ Backend team với:
- Attempt ID
- Question ID  
- Error message từ API
- Request body đã gửi
