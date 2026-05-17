const express = require('express');
const router = express.Router();
const pool = require('../db');
const { recordRequest, recordSuccess, recordError } = require('../stats');
const { validate, gradesStudentQuerySchema, gradesSingleSchema, gradesBulkSchema, errorResponse, successResponse } = require('../validation');

const SUBJECTS = [
  'Mathematics', 'English Language', 'Chichewa', 'Biology',
  'Physics', 'Chemistry', 'Social Studies', 'Religious Education', 'Life Skills'
];

const REMARKS = { A: 'Distinction', B: 'Credit', C: 'Pass', D: 'Pass', F: 'Fail' };

// ── GET /api/grades/student?examNumber= ──────────────────────
// Fetch existing grades for a student (for edit mode)
router.get('/student', validate(gradesStudentQuerySchema), async (req, res) => {
  recordRequest();
  const { examNumber } = req.validated;

  const start = Date.now();
  try {
    const result = await pool.query(
      `SELECT * FROM exam_results WHERE exam_number = $1 LIMIT 9`,
      [examNumber]
    );
    const ms = Date.now() - start;
    if (result.rows.length === 0) {
      recordError(404, ms);
      return res.status(404).json(errorResponse(404, 'Student not found'));
    }
    recordSuccess(ms);
    res.json(successResponse(result.rows));
  } catch (err) {
    recordError(500, Date.now() - start);
    res.status(500).json(errorResponse(500, 'Database error'));
  }
});

// ── POST /api/grades/single ──────────────────────────────────
// Add or update grades for one student
router.post('/single', validate(gradesSingleSchema), async (req, res) => {
  recordRequest();
  const { examNumber, dateOfBirth, studentName, school, examYear, grades } = req.validated;

  const start = Date.now();
  // Validate subjects
  for (const g of grades) {
    if (!SUBJECTS.includes(g.subject)) {
      recordError(400, Date.now() - start);
      return res.status(400).json(errorResponse(400, `Invalid subject: ${g.subject}`));
    }
  }

  try {
    // Delete existing records for this student then re-insert (upsert pattern)
    await pool.query(`DELETE FROM exam_results WHERE exam_number = $1`, [examNumber]);

    for (const g of grades) {
      await pool.query(
        `INSERT INTO exam_results (exam_number, date_of_birth, student_name, school, exam_year, subject, grade, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [examNumber, dateOfBirth, studentName, school, examYear, g.subject, g.grade, REMARKS[g.grade]]
      );
    }

    recordSuccess(Date.now() - start);
    res.json(successResponse({ examNumber, studentName }, `Grades saved for ${studentName}`));
  } catch (err) {
    recordError(500, Date.now() - start);
    console.error(err.message);
    res.status(500).json(errorResponse(500, 'Failed to save grades'));
  }
});

// ── POST /api/grades/bulk ────────────────────────────────────
// Bulk upload grades from CSV data
router.post('/bulk', validate(gradesBulkSchema), async (req, res) => {
  recordRequest();
  const { rows } = req.validated;

  const start = Date.now();
  let inserted = 0;
  let failed = 0;
  const errors = [];

  try {
    for (const row of rows) {
      const { examNumber, dateOfBirth, studentName, school, examYear, subject, grade } = row;

      if (!SUBJECTS.includes(subject)) {
        failed++;
        errors.push(`Invalid subject "${subject}" for ${examNumber}`);
        continue;
      }

      try {
        await pool.query(
          `DELETE FROM exam_results WHERE exam_number = $1 AND subject = $2`,
          [examNumber, subject]
        );
        await pool.query(
          `INSERT INTO exam_results (exam_number, date_of_birth, student_name, school, exam_year, subject, grade, remarks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [examNumber, dateOfBirth, studentName, school, examYear, subject, grade, REMARKS[grade]]
        );
        inserted++;
      } catch (e) {
        failed++;
        errors.push(`Error for ${examNumber}: ${e.message}`);
      }
    }

    recordSuccess(Date.now() - start);
    res.json(successResponse({ inserted, failed, errors: errors.slice(0, 10) }));
  } catch (err) {
    recordError(500, Date.now() - start);
    res.status(500).json(errorResponse(500, 'Bulk upload failed'));
  }
});

module.exports = router;
