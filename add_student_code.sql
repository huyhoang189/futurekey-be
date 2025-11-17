-- Thêm cột student_code vào bảng auth_impl_user_student
ALTER TABLE auth_impl_user_student 
ADD COLUMN student_code VARCHAR(100) NULL AFTER class_id,
ADD INDEX idx_student_code (student_code);
