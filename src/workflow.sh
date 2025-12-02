// Danh mục câu hỏi (Question Category)
model question_categories {
  id          String    @id @default(dbgenerated("(uuid())")) @db.VarChar(36)
  name        String    @db.VarChar(255)
  description String?   @db.Text
  parent_id   String?   @db.VarChar(36) // Cho phép danh mục con
  subject_id  String?   @db.VarChar(36) // Môn học (nếu có)
  grade_level Int?      // Khối lớp
  order_index Int?
  is_active   Boolean?  @default(true)
  created_by  String?   @db.VarChar(36)
  created_at  DateTime? @default(now()) @db.Timestamp(0)
  updated_at  DateTime? @default(now()) @db.Timestamp(0)

  @@index([parent_id], map: "idx_parent_id")
  @@index([subject_id], map: "idx_subject_id")
  @@index([grade_level], map: "idx_grade_level")
  @@index([is_active], map: "idx_is_active")
}

// Bảng câu hỏi
model questions {
  id            String                @id @default(dbgenerated("(uuid())")) @db.VarChar(36)
  category_id   String                @db.VarChar(36) // Danh mục câu hỏi
  question_type question_type         // ENUM
  question_text String                @db.Text
  points        Int?                  @default(1)
  explanation   String?               @db.Text
  difficulty    question_difficulty?  @default(MEDIUM)
  
  // Metadata linh hoạt cho từng loại câu hỏi
  metadata      Json?
  /* Ví dụ:
     - TRUE_FALSE: {correct_answer: true}
     - SINGLE_CHOICE/MULTIPLE_CHOICE: {correct_options: ["A", "C"]}
     - ESSAY: {min_words: 100, max_words: 500, grading_criteria: "..."}
  */
  
  subject_id    String?               @db.VarChar(36)
  grade_level   Int?
  tags          String?               @db.VarChar(500)
  
  usage_count   Int?                  @default(0) // Số lần câu hỏi được dùng
  is_active     Boolean?              @default(true)
  created_by    String?               @db.VarChar(36)
  created_at    DateTime?             @default(now()) @db.Timestamp(0)
  updated_at    DateTime?             @default(now()) @db.Timestamp(0)

  @@index([category_id], map: "idx_category_id")
  @@index([question_type], map: "idx_question_type")
  @@index([subject_id], map: "idx_subject_id")
  @@index([grade_level], map: "idx_grade_level")
  @@index([difficulty], map: "idx_difficulty")
  @@index([is_active], map: "idx_is_active")
  @@index([category_id, is_active], map: "idx_category_active")
}

// Bảng lựa chọn (cho câu hỏi trắc nghiệm)
model question_options {
  id          String    @id @default(dbgenerated("(uuid())")) @db.VarChar(36)
  question_id String    @db.VarChar(36)
  option_key  String    @db.VarChar(10)  // A, B, C, D
  option_text String    @db.Text
  is_correct  Boolean   @default(false)
  order_index Int?
  created_at  DateTime? @default(now()) @db.Timestamp(0)
  updated_at  DateTime? @default(now()) @db.Timestamp(0)

  @@index([question_id], map: "idx_question_id")
  @@index([question_id, order_index], map: "idx_question_order")
}

// Bảng đề thi (Exam)
model exams {
  id              String        @id @default(dbgenerated("(uuid())")) @db.VarChar(36)
  title           String        @db.VarChar(500)
  description     String?       @db.Text
  exam_code       String?       @unique @db.VarChar(50) // Mã đề thi
  subject_id      String?       @db.VarChar(36)
  grade_level     Int?
  
  duration        Int?          // Thời gian làm bài (phút)
  total_points    Int?          // Tổng điểm
  passing_score   Int?          // Điểm đạt
  
  exam_type       exam_type?    @default(PRACTICE) // Loại đề: Luyện tập, Kiểm tra, Thi chính thức
  difficulty      question_difficulty? @default(MEDIUM)
  
  // Cấu hình random câu hỏi
  is_random       Boolean?      @default(false) // Có random câu hỏi không
  shuffle_options Boolean?      @default(false) // Có xáo trộn đáp án không
  
  // Quyền truy cập
  is_public       Boolean?      @default(false)
  school_id       String?       @db.VarChar(36) // Trường tạo đề (null = hệ thống)
  created_by      String?       @db.VarChar(36)
  
  // Thời gian hiệu lực
  start_date      DateTime?     @db.DateTime(0)
  end_date        DateTime?     @db.DateTime(0)
  
  is_active       Boolean?      @default(true)
  created_at      DateTime?     @default(now()) @db.Timestamp(0)
  updated_at      DateTime?     @default(now()) @db.Timestamp(0)

  @@index([exam_code], map: "idx_exam_code")
  @@index([subject_id], map: "idx_subject_id")
  @@index([grade_level], map: "idx_grade_level")
  @@index([school_id], map: "idx_school_id")
  @@index([created_by], map: "idx_created_by")
  @@index([is_active], map: "idx_is_active")
  @@index([exam_type], map: "idx_exam_type")
}

// Cấu hình random câu hỏi theo danh mục (Exam Question Distribution)
model exam_question_distributions {
  id                String    @id @default(dbgenerated("(uuid())")) @db.VarChar(36)
  exam_id           String    @db.VarChar(36)
  category_id       String    @db.VarChar(36)
  
  // Số lượng câu hỏi cần random từ danh mục này
  question_count    Int       // VD: Lấy 5 câu từ danh mục "Đại số"
  
  // Phân bổ theo độ khó (optional)
  easy_count        Int?      @default(0)
  medium_count      Int?      @default(0)
  hard_count        Int?      @default(0)
  
  // Điểm cho mỗi câu hỏi trong nhóm này
  points_per_question Int?    @default(1)
  
  order_index       Int?      // Thứ tự xuất hiện trong đề
  created_at        DateTime? @default(now()) @db.Timestamp(0)
  updated_at        DateTime? @default(now()) @db.Timestamp(0)

  @@index([exam_id], map: "idx_exam_id")
  @@index([category_id], map: "idx_category_id")
  @@index([exam_id, order_index], map: "idx_exam_order")
}

// Bảng lưu câu hỏi đã random cho từng đề thi cụ thể
// (Khi student làm bài, sẽ gen 1 bản đề riêng dựa vào config)
model exam_questions {
  id           String    @id @default(dbgenerated("(uuid())")) @db.VarChar(36)
  exam_id      String    @db.VarChar(36)
  question_id  String    @db.VarChar(36)
  order_index  Int       // Thứ tự câu hỏi trong đề
  points       Int?      @default(1) // Điểm cho câu hỏi này
  created_at   DateTime? @default(now()) @db.Timestamp(0)
  updated_at   DateTime? @default(now()) @db.Timestamp(0)

  @@unique([exam_id, question_id], map: "unique_exam_question")
  @@index([exam_id], map: "idx_exam_id")
  @@index([question_id], map: "idx_question_id")
  @@index([exam_id, order_index], map: "idx_exam_order")
}

// Bài làm của học sinh (Student Exam Attempt)
model student_exam_attempts {
  id                String                    @id @default(dbgenerated("(uuid())")) @db.VarChar(36)
  student_id        String                    @db.VarChar(36)
  exam_id           String                    @db.VarChar(36)
  
  // Mỗi lần làm sẽ có 1 snapshot câu hỏi riêng (nếu random)
  snapshot_data     Json?                     // Lưu toàn bộ đề + câu hỏi đã random
  
  start_time        DateTime?                 @db.DateTime(0)
  submit_time       DateTime?                 @db.DateTime(0)
  duration_seconds  Int?                      // Thời gian làm bài thực tế
  
  total_score       Float?                    @default(0)
  max_score         Int?
  
  status            student_exam_attempt_status? @default(IN_PROGRESS)
  
  // Auto-grading cho trắc nghiệm, manual cho tự luận
  is_auto_graded    Boolean?                  @default(false)
  graded_by         String?                   @db.VarChar(36)
  graded_at         DateTime?                 @db.DateTime(0)
  
  created_at        DateTime?                 @default(now()) @db.Timestamp(0)
  updated_at        DateTime?                 @default(now()) @db.Timestamp(0)

  @@index([student_id], map: "idx_student_id")
  @@index([exam_id], map: "idx_exam_id")
  @@index([status], map: "idx_status")
  @@index([student_id, exam_id], map: "idx_student_exam")
}

// Câu trả lời của học sinh
model student_answers {
  id              String                   @id @default(dbgenerated("(uuid())")) @db.VarChar(36)
  attempt_id      String                   @db.VarChar(36) // Link đến student_exam_attempts
  question_id     String                   @db.VarChar(36)
  
  // Câu trả lời (format tùy loại câu hỏi)
  answer_data     Json?
  /* Ví dụ:
     - TRUE_FALSE: {value: true}
     - SINGLE_CHOICE: {selected: "A"}
     - MULTIPLE_CHOICE: {selected: ["A", "C"]}
     - ESSAY: {text: "Bài làm của học sinh..."}
  */
  
  is_correct      Boolean?                 // Null cho tự luận chưa chấm
  score           Float?                   @default(0)
  max_score       Int?
  
  // Feedback từ giáo viên (cho tự luận)
  feedback        String?                  @db.Text
  graded_by       String?                  @db.VarChar(36)
  graded_at       DateTime?                @db.DateTime(0)
  
  created_at      DateTime?                @default(now()) @db.Timestamp(0)
  updated_at      DateTime?                @default(now()) @db.Timestamp(0)

  @@index([attempt_id], map: "idx_attempt_id")
  @@index([question_id], map: "idx_question_id")
  @@index([attempt_id, question_id], map: "idx_attempt_question")
}

// ENUMS
enum question_type {
  TRUE_FALSE
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  ESSAY
}

enum question_difficulty {
  EASY
  MEDIUM
  HARD
}

enum exam_type {
  PRACTICE        // Luyện tập
  QUIZ           // Kiểm tra nhỏ
  MIDTERM        // Giữa kỳ
  FINAL          // Cuối kỳ
  MOCK_EXAM      // Thi thử
}

enum student_exam_attempt_status {
  IN_PROGRESS
  SUBMITTED
  GRADED
  EXPIRED
}

Workflow tạo đề thi random:
1. Tạo template đề thi:
// Tạo đề thi "Toán lớp 10 - Giữa kỳ 1"
const exam = await prisma.exams.create({
  data: {
    title: "Đề kiểm tra Toán học - Giữa kỳ 1",
    exam_code: "TOAN10-GK1-2024",
    grade_level: 10,
    duration: 90,
    total_points: 100,
    is_random: true, // Cho phép random
    shuffle_options: true
  }
});

// Cấu hình random: Lấy 10 câu Đại số, 10 câu Hình học, 5 câu Xác suất
await prisma.exam_question_distributions.createMany({
  data: [
    {
      exam_id: exam.id,
      category_id: "category-dai-so",
      question_count: 10,
      easy_count: 3,
      medium_count: 5,
      hard_count: 2,
      points_per_question: 1,
      order_index: 1
    },
    {
      exam_id: exam.id,
      category_id: "category-hinh-hoc",
      question_count: 10,
      easy_count: 4,
      medium_count: 4,
      hard_count: 2,
      points_per_question: 1,
      order_index: 2
    },
    {
      exam_id: exam.id,
      category_id: "category-xac-suat",
      question_count: 5,
      easy_count: 2,
      medium_count: 2,
      hard_count: 1,
      points_per_question: 2,
      order_index: 3
    }
  ]
});
2. Khi học sinh làm bài - Random câu hỏi:
async function generateExamForStudent(examId, studentId) {
  // Lấy config random
  const distributions = await prisma.exam_question_distributions.findMany({
    where: { exam_id: examId },
    orderBy: { order_index: 'asc' }
  });

  let allQuestions = [];
  let orderIndex = 1;

  for (const dist of distributions) {
    // Random câu hỏi theo độ khó
    const questions = await prisma.questions.findMany({
      where: {
        category_id: dist.category_id,
        is_active: true,
        difficulty: { in: ['EASY', 'MEDIUM', 'HARD'] }
      },
      take: dist.question_count,
      orderBy: { usage_count: 'asc' } // Ưu tiên câu ít dùng
    });

    // Thêm vào danh sách
    questions.forEach(q => {
      allQuestions.push({
        question_id: q.id,
        order_index: orderIndex++,
        points: dist.points_per_question
      });
    });
  }

  // Tạo attempt với snapshot
  const attempt = await prisma.student_exam_attempts.create({
    data: {
      student_id: studentId,
      exam_id: examId,
      snapshot_data: { questions: allQuestions },
      start_time: new Date(),
      status: 'IN_PROGRESS'
    }
  });

  return { attempt, questions: allQuestions };
}