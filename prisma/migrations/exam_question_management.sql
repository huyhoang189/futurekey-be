-- Migration for Exam and Question Management System
-- Created: 2024

-- Create ENUM types
-- Note: MySQL doesn't have native ENUM type like PostgreSQL, so we use VARCHAR with CHECK constraints

-- Table: question_categories
CREATE TABLE IF NOT EXISTS `question_categories` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `parent_id` VARCHAR(36) NULL,
  `order_index` INT NULL,
  `created_by` VARCHAR(36) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_question_categories_parent_id` (`parent_id`),
  INDEX `idx_question_categories_is_active` (`is_active`),
  INDEX `idx_question_categories_created_by` (`created_by`),
  CONSTRAINT `fk_question_categories_created_by` FOREIGN KEY (`created_by`) REFERENCES `auth_base_user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: questions
CREATE TABLE IF NOT EXISTS `questions` (
  `id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NULL,
  `career_criteria_id` VARCHAR(36) NULL,
  `question_type` ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') NOT NULL,
  `difficulty_level` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
  `content` TEXT NOT NULL,
  `options` JSON NULL COMMENT 'JSON array for multiple choice options',
  `correct_answer` TEXT NULL,
  `explanation` TEXT NULL,
  `points` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  `time_limit` INT NULL COMMENT 'Time limit in seconds',
  `metadata` JSON NULL COMMENT 'Flexible metadata for different question types',
  `tags` VARCHAR(500) NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `created_by` VARCHAR(36) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_questions_category_id` (`category_id`),
  INDEX `idx_questions_career_criteria_id` (`career_criteria_id`),
  INDEX `idx_questions_question_type` (`question_type`),
  INDEX `idx_questions_difficulty_level` (`difficulty_level`),
  INDEX `idx_questions_is_active` (`is_active`),
  INDEX `idx_questions_created_by` (`created_by`),
  INDEX `idx_questions_category_active` (`category_id`, `is_active`),
  CONSTRAINT `fk_questions_category` FOREIGN KEY (`category_id`) REFERENCES `question_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_questions_career_criteria` FOREIGN KEY (`career_criteria_id`) REFERENCES `career_criteria` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_questions_created_by` FOREIGN KEY (`created_by`) REFERENCES `auth_base_user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: question_options
CREATE TABLE IF NOT EXISTS `question_options` (
  `id` VARCHAR(36) NOT NULL,
  `question_id` VARCHAR(36) NOT NULL,
  `option_key` VARCHAR(10) NOT NULL COMMENT 'A, B, C, D',
  `option_text` TEXT NOT NULL,
  `is_correct` BOOLEAN NOT NULL DEFAULT false,
  `order_index` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_question_options_question_id` (`question_id`),
  INDEX `idx_question_options_question_order` (`question_id`, `order_index`),
  CONSTRAINT `fk_question_options_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: exams
CREATE TABLE IF NOT EXISTS `exams` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `exam_code` VARCHAR(50) NULL UNIQUE,
  `class_id` VARCHAR(36) NULL,
  `exam_type` ENUM('PRACTICE', 'QUIZ', 'MIDTERM', 'FINAL', 'MOCK_TEST') NOT NULL DEFAULT 'PRACTICE',
  `duration_minutes` INT NULL,
  `total_points` DECIMAL(6,2) NULL,
  `passing_score` DECIMAL(6,2) NULL,
  `instructions` TEXT NULL,
  `is_shuffle_questions` BOOLEAN NOT NULL DEFAULT false,
  `is_shuffle_options` BOOLEAN NOT NULL DEFAULT false,
  `show_results_immediately` BOOLEAN NOT NULL DEFAULT false,
  `max_attempts` INT NULL COMMENT 'NULL means unlimited',
  `start_time` DATETIME(3) NULL,
  `end_time` DATETIME(3) NULL,
  `created_by` VARCHAR(36) NULL,
  `is_published` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_exams_exam_code` (`exam_code`),
  INDEX `idx_exams_class_id` (`class_id`),
  INDEX `idx_exams_exam_type` (`exam_type`),
  INDEX `idx_exams_is_published` (`is_published`),
  INDEX `idx_exams_created_by` (`created_by`),
  CONSTRAINT `fk_exams_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_exams_created_by` FOREIGN KEY (`created_by`) REFERENCES `auth_base_user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: exam_question_distributions
CREATE TABLE IF NOT EXISTS `exam_question_distributions` (
  `id` VARCHAR(36) NOT NULL,
  `exam_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NULL,
  `career_criteria_id` VARCHAR(36) NULL,
  `question_type` ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') NULL,
  `difficulty_level` ENUM('EASY', 'MEDIUM', 'HARD') NULL,
  `quantity` INT NOT NULL COMMENT 'Number of questions to select',
  `easy_count` INT NOT NULL DEFAULT 0,
  `medium_count` INT NOT NULL DEFAULT 0,
  `hard_count` INT NOT NULL DEFAULT 0,
  `points_per_question` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  `order_index` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_exam_question_distributions_exam_id` (`exam_id`),
  INDEX `idx_exam_question_distributions_category_id` (`category_id`),
  INDEX `idx_exam_question_distributions_career_criteria_id` (`career_criteria_id`),
  INDEX `idx_exam_question_distributions_exam_order` (`exam_id`, `order_index`),
  CONSTRAINT `fk_exam_question_distributions_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_exam_question_distributions_category` FOREIGN KEY (`category_id`) REFERENCES `question_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_exam_question_distributions_career_criteria` FOREIGN KEY (`career_criteria_id`) REFERENCES `career_criteria` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: exam_questions
CREATE TABLE IF NOT EXISTS `exam_questions` (
  `id` VARCHAR(36) NOT NULL,
  `exam_id` VARCHAR(36) NOT NULL,
  `question_id` VARCHAR(36) NOT NULL,
  `order_index` INT NOT NULL,
  `points` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_exam_questions_exam_id` (`exam_id`),
  INDEX `idx_exam_questions_question_id` (`question_id`),
  INDEX `idx_exam_questions_exam_order` (`exam_id`, `order_index`),
  UNIQUE INDEX `unique_exam_question` (`exam_id`, `question_id`),
  CONSTRAINT `fk_exam_questions_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_exam_questions_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_exam_attempts
CREATE TABLE IF NOT EXISTS `student_exam_attempts` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `exam_id` VARCHAR(36) NOT NULL,
  `snapshot_data` JSON NULL COMMENT 'Snapshot of exam with randomized questions',
  `start_time` DATETIME(3) NULL,
  `submit_time` DATETIME(3) NULL,
  `duration_seconds` INT NULL,
  `total_score` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `max_score` DECIMAL(6,2) NULL,
  `status` ENUM('IN_PROGRESS', 'COMPLETED', 'SUBMITTED', 'GRADED', 'EXPIRED') NOT NULL DEFAULT 'IN_PROGRESS',
  `is_auto_graded` BOOLEAN NOT NULL DEFAULT false,
  `graded_by` VARCHAR(36) NULL,
  `graded_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_student_exam_attempts_student_id` (`student_id`),
  INDEX `idx_student_exam_attempts_exam_id` (`exam_id`),
  INDEX `idx_student_exam_attempts_status` (`status`),
  INDEX `idx_student_exam_attempts_student_exam` (`student_id`, `exam_id`),
  CONSTRAINT `fk_student_exam_attempts_student` FOREIGN KEY (`student_id`) REFERENCES `auth_impl_user_student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_student_exam_attempts_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_answers
CREATE TABLE IF NOT EXISTS `student_answers` (
  `id` VARCHAR(36) NOT NULL,
  `attempt_id` VARCHAR(36) NOT NULL,
  `question_id` VARCHAR(36) NOT NULL,
  `answer_data` JSON NULL COMMENT 'Answer in flexible format',
  `is_correct` BOOLEAN NULL,
  `score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `max_score` DECIMAL(5,2) NULL,
  `feedback` TEXT NULL,
  `graded_by` VARCHAR(36) NULL,
  `graded_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_student_answers_attempt_id` (`attempt_id`),
  INDEX `idx_student_answers_question_id` (`question_id`),
  INDEX `idx_student_answers_attempt_question` (`attempt_id`, `question_id`),
  UNIQUE INDEX `unique_attempt_question` (`attempt_id`, `question_id`),
  CONSTRAINT `fk_student_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `student_exam_attempts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_student_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
