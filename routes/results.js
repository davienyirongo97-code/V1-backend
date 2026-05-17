const express = require('express');
const router = express.Router();
const pool = require('../db');
const { recordRequest, recordSuccess, recordError } = require('../stats');
const { validate, resultsQuerySchema, errorResponse, successResponse } = require('../validation');

router.get('/', validate(resultsQuerySchema), async (req, res) => {
  recordRequest();
  const { examNumber, dob } = req.validated;

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
      recordError(404, ms);
      return res.status(404).json(errorResponse(404, 'No results found'));
    }

    recordSuccess(ms);
    const first = result.rows[0];
    res.json(successResponse({
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
    }));

  } catch (err) {
    const ms = Date.now() - start;
    if (err.code === '57014' || err.message.includes('timeout') || err.message.includes('queue') || ms >= 15000) {
      recordError(504, ms);
      return res.status(504).json(errorResponse(504, 'Gateway Timeout — server under load'));
    }
    recordError(500, ms);
    console.error('DB error:', err.code, err.message);
    res.status(500).json(errorResponse(500, 'Internal server error'));
  }
});

module.exports = router;
