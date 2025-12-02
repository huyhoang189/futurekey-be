# Career Evaluation API Guide

## Overview
Hệ thống đánh giá nghề nghiệp cho phép học sinh tự đánh giá mức độ phù hợp với nghề nghiệp dựa trên các tiêu chí. Giáo viên/Nhà trường có thể cấu hình trọng số cho từng tiêu chí và ngưỡng điểm để phân loại kết quả.

## Scoring Formula
```
weighted_sum = Σ(score × weight/100)
final_score = weighted_sum × number_of_criteria
max_score = number_of_criteria × 10
```

**Examples:**
- 5 tiêu chí: max_score = 50
- 10 tiêu chí: max_score = 100

## Evaluation Result Types
- `VERY_SUITABLE`: Rất phù hợp (điểm >= very_suitable_min)
- `SUITABLE`: Phù hợp (suitable_min <= điểm < very_suitable_min)
- `NOT_SUITABLE`: Không phù hợp (điểm < suitable_min)

## Database Schema

### 1. class_criteria_weights
Lưu trọng số của từng tiêu chí cho mỗi lớp và nghề nghiệp.

```prisma
model class_criteria_weights {
  id                String   @id @default(uuid())
  class_id          String
  career_id         String
  career_criteria_id String
  weight            Decimal  @db.Decimal(5, 2)  // 0-100
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  @@unique([class_id, career_id, career_criteria_id])
}
```

### 2. career_evaluation_thresholds
Lưu ngưỡng điểm để phân loại kết quả đánh giá.

```prisma
model career_evaluation_thresholds {
  id                  String   @id @default(uuid())
  class_id            String
  career_id           String
  very_suitable_min   Decimal  @db.Decimal(5, 2)
  suitable_min        Decimal  @db.Decimal(5, 2)
  max_score           Decimal  @db.Decimal(5, 2)  // auto-calculated
  number_of_criteria  Int
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  
  @@unique([class_id, career_id])
}
```

### 3. student_career_evaluations
Lưu kết quả đánh giá của học sinh.

```prisma
model student_career_evaluations {
  id                 String                 @id @default(uuid())
  student_id         String
  class_id           String
  career_id          String
  raw_scores         Json                   // [{career_criteria_id, score}, ...]
  weighted_score     Decimal                @db.Decimal(5, 2)
  final_score        Decimal                @db.Decimal(5, 2)
  evaluation_result  evaluation_result_type
  evaluated_at       DateTime               @default(now())
}
```

## API Endpoints

### For Students (v2/schools/students)

#### 1. Submit Career Evaluation
```http
POST /api/v2/schools/students/career-evaluation/submit
```

**Request Body:**
```json
{
  "class_id": "class-uuid",
  "career_id": "career-uuid",
  "scores": [
    {
      "career_criteria_id": "criteria-uuid-1",
      "score": 8
    },
    {
      "career_criteria_id": "criteria-uuid-2",
      "score": 7
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Career evaluation submitted successfully",
  "data": {
    "id": "evaluation-uuid",
    "student_id": "student-uuid",
    "class_id": "class-uuid",
    "career_id": "career-uuid",
    "raw_scores": [...],
    "weighted_score": 7.5,
    "final_score": 37.5,
    "evaluation_result": "VERY_SUITABLE",
    "evaluated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Get My Evaluation Results
```http
GET /api/v2/schools/students/career-evaluation/results?career_id=xxx&class_id=yyy
```

**Response:**
```json
{
  "success": true,
  "message": "Get evaluation results successfully",
  "data": [
    {
      "id": "evaluation-uuid",
      "weighted_score": 7.5,
      "final_score": 37.5,
      "evaluation_result": "VERY_SUITABLE",
      "evaluated_at": "2024-01-01T00:00:00.000Z",
      "career": {...},
      "class": {...},
      "detailed_scores": [
        {
          "career_criteria_id": "criteria-uuid-1",
          "criteria_name": "Tư duy logic",
          "score": 8,
          "weight": 20,
          "weighted_value": 1.6
        }
      ]
    }
  ]
}
```

### For Teachers/School Users (v2/schools/school-users)

#### 1. Configure Criteria Weights
```http
POST /api/v2/schools/school-users/career-evaluation/weights
```

**Request Body:**
```json
{
  "class_id": "class-uuid",
  "career_id": "career-uuid",
  "weights": [
    {
      "career_criteria_id": "criteria-uuid-1",
      "weight": 20
    },
    {
      "career_criteria_id": "criteria-uuid-2",
      "weight": 30
    },
    {
      "career_criteria_id": "criteria-uuid-3",
      "weight": 50
    }
  ]
}
```

**Note:** Tổng weight phải = 100

#### 2. Get Criteria Weights
```http
GET /api/v2/schools/school-users/career-evaluation/weights?class_id=xxx&career_id=yyy
```

#### 3. Configure Evaluation Thresholds
```http
POST /api/v2/schools/school-users/career-evaluation/thresholds
```

**Request Body:**
```json
{
  "class_id": "class-uuid",
  "career_id": "career-uuid",
  "very_suitable_min": 40,
  "suitable_min": 30,
  "number_of_criteria": 5
}
```

**Note:** max_score sẽ được tự động tính = number_of_criteria × 10

#### 4. Get Evaluation Thresholds
```http
GET /api/v2/schools/school-users/career-evaluation/thresholds?class_id=xxx&career_id=yyy
```

#### 5. Get Evaluation Statistics
```http
GET /api/v2/schools/school-users/career-evaluation/statistics?class_id=xxx&career_id=yyy
```

**Response:**
```json
{
  "success": true,
  "message": "Get evaluation statistics successfully",
  "data": {
    "total_evaluations": 30,
    "very_suitable_count": 10,
    "suitable_count": 15,
    "not_suitable_count": 5,
    "average_score": 35.5,
    "details": [
      {
        "student": {...},
        "final_score": 42,
        "evaluation_result": "VERY_SUITABLE"
      }
    ]
  }
}
```

## File Structure

```
src/apis/v2/
├── controllers/
│   └── schools/
│       ├── students.controller.js         # Student APIs
│       └── schoolUser.controller.js       # Config APIs
├── services/
│   └── schools/
│       └── careerEvaluations.service.js   # Business logic
└── routes/
    └── schools/
        ├── students.routes.js             # Student routes
        └── schoolUsers.routes.js          # Config routes
```

## Usage Workflow

1. **Setup Phase (Teacher)**
   - Cấu hình trọng số tiêu chí cho lớp + nghề: `POST /career-evaluation/weights`
   - Cấu hình ngưỡng đánh giá: `POST /career-evaluation/thresholds`

2. **Evaluation Phase (Student)**
   - Học sinh nộp bài đánh giá: `POST /career-evaluation/submit`
   - Xem kết quả của mình: `GET /career-evaluation/results`

3. **Review Phase (Teacher)**
   - Xem thống kê kết quả lớp: `GET /career-evaluation/statistics`
   - Xem cấu hình hiện tại: `GET /career-evaluation/weights`, `GET /career-evaluation/thresholds`

## Validation Rules

1. **Weights Configuration:**
   - Tổng weight phải = 100%
   - Mỗi weight: 0 ≤ weight ≤ 100
   - Phải cấu hình đủ tất cả tiêu chí của nghề nghiệp

2. **Score Submission:**
   - Mỗi score: 0 ≤ score ≤ 10
   - Phải nộp đủ điểm cho tất cả tiêu chí
   - Phải có cấu hình weights trước khi nộp bài

3. **Threshold Configuration:**
   - 0 ≤ suitable_min < very_suitable_min ≤ max_score
   - max_score = number_of_criteria × 10

## Sample Data

See `migration/career_evaluation_system.sql` for:
- Example với 5 tiêu chí (max_score = 50)
- Example với 10 tiêu chí (max_score = 100)
- Sample weights configuration
- Sample thresholds configuration
- Sample student evaluations
