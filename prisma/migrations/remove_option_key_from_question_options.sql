-- Migration: Remove option_key field from question_options table
-- Date: 2025-12-17
-- Description: FE will auto-generate ABCD based on order_index, students will submit question_option_id instead of option_key

-- Remove option_key column
ALTER TABLE `question_options` DROP COLUMN `option_key`;

-- Note: 
-- 1. FE sẽ tự động sinh ABCD dựa trên order_index (0=A, 1=B, 2=C, 3=D)
-- 2. Học sinh nộp bài sẽ gửi question_option_id thay vì option_key
-- 3. Snapshot_data lưu correct_option_id thay vì correct_answer
