const express = require('express');
const router = express.Router();
const pool = require('../db');
const { recordRequest, recordSuccess, recordError, recordTimeout, recordCrash } = require('../stats');

router.get('/', async (req, res) => {
  recordRequest();
  const { examNumber, dob } = req.query;

  if (!examNumber || !dob) {
    recordError(400);
    return res.status(400).json({ error: 'Please provide both examNumber and dob.' });
  }

  const start = Date.now();

  try {
    const result = await pool.query(
      `SELECT student_name, school, exam_number, exam_year, subject, grade, remarks
       FROM exam_results
       WHERE exam_number = $1
       AND date_of_birth = $2`,
      [examNumber, dob]
    );

    const ms = Date.now() - start;

    if (result.rows.length === 0) {
      // Student not found — counts as error in load test metrics
      recordError(404, ms);
      return res.status(404).json({ error: 'No results found.' });
    }

    recordSuccess(ms);
    const first = result.rows[0];
    res.json({
      student: {
        name:       first.student_name,
        school:     first.school,
        examNumber: first.exam_number,
        examYear:   first.exam_year,
      },
      results: result.rows.map(row => ({
        subject: row.subject,
        grade:   row.grade,
        remarks: row.remarks,
      }))
    });

  } catch (err) {
    const ms = Date.now() - start;
    // Connection timeout, statement timeout, or queue timeout = 504
    if (err.code === '57014' || err.message.includes('timeout') || err.message.includes('queue') || ms >= 15000) {
      recordError(504, ms);
      return res.status(504).json({ error: 'Gateway Timeout — server under load.' });
    }
    recordError(500, ms);
    console.error('DB error:', err.code, err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
