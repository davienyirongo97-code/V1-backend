-- MANEB Exam Results System — v1 Bulk Seed Data
-- Generates 50,000 random students x 9 subjects = 450,000 rows
-- All in one flat table — zero normal form, maximum duplication
-- Run after schema.sql and seed.sql

TRUNCATE TABLE exam_results;

INSERT INTO exam_results (exam_number, date_of_birth, student_name, school, exam_year, subject, grade, remarks)
SELECT
  i::TEXT,
  DATE '2004-01-01' + (i - 1),
  'Student ' || i,
  (ARRAY[
    'Kamuzu Academy','St Johns Secondary','Dedza Secondary',
    'Blantyre Secondary','Zomba Catholic','Lilongwe Girls',
    'Mzuzu Boys','Marist Brothers','Henry Henderson',
    'Chichiri Secondary','Soche Hill','Domasi Secondary'
  ])[floor(random() * 12 + 1)::INT],
  2024,
  subj,
  grade_val,
  CASE grade_val
    WHEN 'A' THEN 'Distinction'
    WHEN 'B' THEN 'Credit'
    WHEN 'C' THEN 'Pass'
    WHEN 'D' THEN 'Pass'
    WHEN 'F' THEN 'Fail'
  END
FROM generate_series(1, 50000) AS i
CROSS JOIN (
  VALUES
    ('Mathematics'),('English Language'),('Chichewa'),('Biology'),
    ('Physics'),('Chemistry'),('Social Studies'),('Religious Education'),('Life Skills')
) AS subjects(subj)
CROSS JOIN LATERAL (
  SELECT (ARRAY['A','B','C','D','F'])[floor(random() * 5 + 1)::INT] AS grade_val
) AS g;
