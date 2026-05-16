const express = require('express');
const router = express.Router();
const pool = require('../db');
const { recordRequest, recordSuccess, recordError } = require('../stats');

const SUBJECTS = [
  'Mathematics', 'English Language', 'Chichewa', 'Biology',
  'Physics', 'Chemistry', 'Social Studies', 'Religious Education', 'Life Skills'
];

const VALID_GRADES = ['A', 'B', 'C', 'D', 'F'];

const REMARKS = { A: 'Distinction', B: 'Credit', C: 'Pass', D: 'Pass', F: 'Fail' };

// ── GET /api/grades/student?examNumber= ──────────────────────
// Fetch existing grades for a student (for edit mode)
router.get('/student', async (req, res) => {
  recordRequest();
  const { examNumber } = req.query;
  if (!examNumber) {
    recordError(400);
    return res.status(400).json({ error: 'examNumber is required' });
  }

  const start = Date.now();
  try {
    const result = await pool.query(
      `SELECT * FROM exam_results WHERE exam_number = $1 LIMIT 9`,
      [examNumber]
    );
    const ms = Date.now() - start;
    if (result.rows.length === 0) {
      recordError(404, ms);
      return res.status(404).json({ error: 'Student not found' });
    }
    recordSuccess(ms);
    res.json(result.rows);
  } catch (err) {
    recordError(500, Date.now() - start);
    res.status(500).json({ error: 'Database error' });
  }
});

// ── POST /api/grades/single ──────────────────────────────────
// Add or update grades for one student
router.post('/single', async (req, res) => {
  recordRequest();
  const { examNumber, dateOfBirth, studentName, school, examYear, grades } = req.body;

  if (!examNumber || !dateOfBirth || !studentName || !school || !grades) {
    recordError(400);
    return res.status(400).json({ error: 'All fields are required' });
  }

  const start = Date.now();
  // Validate grades
  for (const g of grades) {
    if (!SUBJECTS.includes(g.subject) || !VALID_GRADES.includes(g.grade)) {
      recordError(400, Date.now() - start);
      return res.status(400).json({ error: `Invalid subject/grade` });
    }
  }

  try {
    // Delete existing records for this student then re-insert (upsert pattern)
    await pool.query(`DELETE FROM exam_results WHERE exam_number = $1`, [examNumber]);

    for (const g of grades) {
      await pool.query(
        `INSERT INTO exam_results (exam_number, date_of_birth, student_name, school, exam_year, subject, grade, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [examNumber, dateOfBirth, studentName, school, examYear || 2024, g.subject, g.grade, REMARKS[g.grade]]
      );
    }

    recordSuccess(Date.now() - start);
    res.json({ success: true, message: `Grades saved for ${studentName}` });
  } catch (err) {
    recordError(500, Date.now() - start);
    console.error(err.message);
    res.status(500).json({ error: 'Failed to save grades' });
  }
});

// ── POST /api/grades/bulk ────────────────────────────────────
// Bulk upload grades from CSV data
// Expected CSV format: examNumber,dateOfBirth,studentName,school,examYear,subject,grade
router.post('/bulk', async (req, res) => {
  recordRequest();
  const { rows } = req.body; // array of parsed CSV rows

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    recordError(400);
    return res.status(400).json({ error: 'No data provided' });
  }

  const start = Date.now();
  let inserted = 0;
  let failed = 0;
  const errors = [];

  try {
    for (const row of rows) {
      const { examNumber, dateOfBirth, studentName, school, examYear, subject, grade } = row;

      if (!examNumber || !dateOfBirth || !studentName || !school || !subject || !grade) {
        failed++;
        errors.push(`Missing fields for row: ${JSON.stringify(row)}`);
        continue;
      }

      if (!VALID_GRADES.includes(grade.toUpperCase())) {
        failed++;
        errors.push(`Invalid grade "${grade}" for ${examNumber}`);
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
          [examNumber, dateOfBirth, studentName, school, examYear || 2024, subject, grade.toUpperCase(), REMARKS[grade.toUpperCase()]]
        );
        inserted++;
      } catch (e) {
        failed++;
        errors.push(`Error for ${examNumber}: ${e.message}`);
      }
    }

    recordSuccess(Date.now() - start);
    res.json({ success: true, inserted, failed, errors: errors.slice(0, 10) });
  } catch (err) {
    recordError(500, Date.now() - start);
    res.status(500).json({ error: 'Bulk upload failed' });
  }
});

module.exports = router;
