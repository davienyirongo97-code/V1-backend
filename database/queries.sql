-- MANEB Exam Results System — v1 Core Query
-- Zero normal form — one flat table, no joins needed
-- Used by: GET /api/results?examNumber=&dob=

SELECT
  student_name,
  school,
  exam_number,
  exam_year,
  subject,
  grade,
  remarks
FROM exam_results
WHERE exam_number = $1
AND date_of_birth = $2;

-- NOTE: No indexes on exam_number or date_of_birth — intentional for v1.
-- Every search scans all 450,000 rows. This is what makes it slow under load.
