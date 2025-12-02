-- ============================================
-- CAREER EVALUATION SYSTEM
-- Hệ thống đánh giá mức độ phù hợp nghề nghiệp
-- ============================================

-- 1. Bảng cấu hình trọng số tiêu chí theo lớp
CREATE TABLE IF NOT EXISTS `class_criteria_weights` (
  `id` VARCHAR(36) NOT NULL,
  `class_id` VARCHAR(36) NOT NULL,
  `career_id` VARCHAR(36) NOT NULL,
  `criteria_id` VARCHAR(36) NOT NULL COMMENT 'ID của career_criteria',
  `weight` INT NOT NULL COMMENT 'Trọng số (0-100%), VD: 20 = 20%',
  `created_by` VARCHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_career_criteria` (`class_id`, `career_id`, `criteria_id`),
  INDEX `idx_class_career` (`class_id`, `career_id`),
  INDEX `idx_criteria` (`criteria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cấu hình trọng số tiêu chí cho từng lớp học';

-- 2. Bảng ngưỡng đánh giá nghề nghiệp
CREATE TABLE IF NOT EXISTS `career_evaluation_thresholds` (
  `id` VARCHAR(36) NOT NULL,
  `class_id` VARCHAR(36) NOT NULL,
  `career_id` VARCHAR(36) NOT NULL,
  `max_score` FLOAT NOT NULL COMMENT 'Điểm tối đa = Số tiêu chí × 10. VD: 5 TC = 50, 10 TC = 100',
  `very_suitable_min` FLOAT NOT NULL COMMENT 'Ngưỡng rất phù hợp. VD: >= 40/50 hoặc >= 80/100',
  `suitable_min` FLOAT NOT NULL COMMENT 'Ngưỡng phù hợp. VD: >= 30/50 hoặc >= 60/100',
  `created_by` VARCHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_career_threshold` (`class_id`, `career_id`),
  INDEX `idx_class` (`class_id`),
  INDEX `idx_career` (`career_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ngưỡng đánh giá mức độ phù hợp nghề nghiệp theo lớp';

-- 3. Bảng kết quả đánh giá nghề nghiệp của học sinh
CREATE TABLE IF NOT EXISTS `student_career_evaluations` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `class_id` VARCHAR(36) NOT NULL,
  `career_id` VARCHAR(36) NOT NULL,
  `raw_scores` JSON NOT NULL COMMENT 'Điểm thô: [{"criteria_id": "TC1", "score": 8}, ...]',
  `weighted_score` FLOAT NOT NULL COMMENT 'Điểm sau khi áp dụng trọng số',
  `max_score` FLOAT NOT NULL COMMENT 'Điểm tối đa (số tiêu chí × 10)',
  `percentage` FLOAT NOT NULL COMMENT 'Phần trăm: (weighted_score / max_score) × 100',
  `evaluation_result` ENUM('VERY_SUITABLE', 'SUITABLE', 'NOT_SUITABLE') DEFAULT 'NOT_SUITABLE',
  `notes` TEXT DEFAULT NULL,
  `evaluated_at` TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
  `created_at` TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_career_class` (`student_id`, `career_id`, `class_id`),
  INDEX `idx_student` (`student_id`),
  INDEX `idx_career_eval` (`career_id`),
  INDEX `idx_class_career_eval` (`class_id`, `career_id`),
  INDEX `idx_eval_result` (`evaluation_result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Kết quả đánh giá nghề nghiệp của học sinh';

-- ============================================
-- DỮ LIỆU MẪU (VÍ DỤ)
-- ============================================

-- VD: Lớp 9A học 5 tiêu chí của nghề "Giáo viên mầm non"
-- Giả sử:
-- - class_id = 'class-9a-123'
-- - career_id = 'career-gvmn-456'
-- - 5 tiêu chí: TC1, TC2, TC3, TC4, TC5

-- 1. Cấu hình trọng số (tổng = 100%)
INSERT INTO `class_criteria_weights` (`id`, `class_id`, `career_id`, `criteria_id`, `weight`) VALUES
(UUID(), 'class-9a-123', 'career-gvmn-456', 'criteria-tc1-789', 20),  -- TC1: 20%
(UUID(), 'class-9a-123', 'career-gvmn-456', 'criteria-tc2-790', 10),  -- TC2: 10%
(UUID(), 'class-9a-123', 'career-gvmn-456', 'criteria-tc3-791', 10),  -- TC3: 10%
(UUID(), 'class-9a-123', 'career-gvmn-456', 'criteria-tc4-792', 40),  -- TC4: 40%
(UUID(), 'class-9a-123', 'career-gvmn-456', 'criteria-tc5-793', 20);  -- TC5: 20%

-- 2. Cấu hình ngưỡng đánh giá (5 tiêu chí → max = 50)
INSERT INTO `career_evaluation_thresholds` (`id`, `class_id`, `career_id`, `max_score`, `very_suitable_min`, `suitable_min`) VALUES
(UUID(), 'class-9a-123', 'career-gvmn-456', 50, 40, 30);
-- Rất phù hợp: >= 40/50
-- Phù hợp: >= 30/50
-- Không phù hợp: < 30/50

-- 3. Kết quả đánh giá của học sinh (VD)
-- Học sinh tự đánh giá: TC1=8, TC2=6, TC3=7, TC4=9, TC5=5
-- Tính toán:
--   weighted_sum = (8×0.2) + (6×0.1) + (7×0.1) + (9×0.4) + (5×0.2) = 7.5
--   final_score = 7.5 × 5 = 37.5/50
--   result = "SUITABLE" (>= 30)
INSERT INTO `student_career_evaluations` 
  (`id`, `student_id`, `class_id`, `career_id`, `raw_scores`, `weighted_score`, `max_score`, `percentage`, `evaluation_result`) 
VALUES (
  UUID(), 
  'student-001', 
  'class-9a-123', 
  'career-gvmn-456',
  '[
    {"criteria_id": "criteria-tc1-789", "score": 8},
    {"criteria_id": "criteria-tc2-790", "score": 6},
    {"criteria_id": "criteria-tc3-791", "score": 7},
    {"criteria_id": "criteria-tc4-792", "score": 9},
    {"criteria_id": "criteria-tc5-793", "score": 5}
  ]',
  37.5,
  50,
  75,
  'SUITABLE'
);

-- ============================================
-- VÍ DỤ 2: Lớp 10B học 10 tiêu chí (max = 100)
-- ============================================

INSERT INTO `class_criteria_weights` (`id`, `class_id`, `career_id`, `criteria_id`, `weight`) VALUES
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc1-789', 15),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc2-790', 10),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc3-791', 5),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc4-792', 20),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc5-793', 10),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc6-794', 10),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc7-795', 5),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc8-796', 10),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc9-797', 10),
(UUID(), 'class-10b-789', 'career-gvmn-456', 'criteria-tc10-798', 5);
-- Tổng = 100%

INSERT INTO `career_evaluation_thresholds` (`id`, `class_id`, `career_id`, `max_score`, `very_suitable_min`, `suitable_min`) VALUES
(UUID(), 'class-10b-789', 'career-gvmn-456', 100, 80, 60);
-- Rất phù hợp: >= 80/100
-- Phù hợp: >= 60/100
-- Không phù hợp: < 60/100

-- ============================================
-- QUERIES HỮU ÍCH
-- ============================================

-- 1. Xem cấu hình trọng số của lớp
SELECT 
  ccw.*,
  cc.name AS criteria_name
FROM class_criteria_weights ccw
LEFT JOIN career_criteria cc ON ccw.criteria_id = cc.id
WHERE ccw.class_id = 'class-9a-123' AND ccw.career_id = 'career-gvmn-456'
ORDER BY ccw.weight DESC;

-- 2. Thống kê kết quả đánh giá theo lớp
SELECT 
  evaluation_result,
  COUNT(*) AS total,
  ROUND(AVG(weighted_score), 2) AS avg_score,
  ROUND(AVG(percentage), 2) AS avg_percentage
FROM student_career_evaluations
WHERE class_id = 'class-9a-123' AND career_id = 'career-gvmn-456'
GROUP BY evaluation_result;

-- 3. Top học sinh phù hợp nhất
SELECT 
  sce.*,
  u.full_name
FROM student_career_evaluations sce
LEFT JOIN auth_base_user u ON sce.student_id = u.id
WHERE sce.class_id = 'class-9a-123' 
  AND sce.career_id = 'career-gvmn-456'
  AND sce.evaluation_result IN ('VERY_SUITABLE', 'SUITABLE')
ORDER BY sce.weighted_score DESC
LIMIT 10;

-- 4. Kiểm tra cấu hình hợp lệ
SELECT 
  class_id,
  career_id,
  SUM(weight) AS total_weight,
  CASE 
    WHEN SUM(weight) = 100 THEN 'VALID'
    ELSE 'INVALID'
  END AS status
FROM class_criteria_weights
GROUP BY class_id, career_id;
