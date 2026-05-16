-- MANEB Exam Results System — v1 (Zero Normal Form / Unnormalised)
-- One flat table, everything duplicated, no foreign keys, no indexes
-- This is intentional — demonstrates an unoptimised database under load

CREATE TABLE exam_results (
  exam_number    VARCHAR(20),
  date_of_birth  DATE,
  student_name   VARCHAR(100),
  school         VARCHAR(100),
  exam_year      INT,
  subject        VARCHAR(100),
  grade          CHAR(1),
  remarks        VARCHAR(20)
);
