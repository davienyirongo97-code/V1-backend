const { z } = require('zod');

// Reusable validation schemas
const schemas = {
  examNumber: z.string().min(1, 'Exam number is required').max(20, 'Exam number too long'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  studentName: z.string().min(1, 'Student name is required').max(100, 'Student name too long'),
  school: z.string().min(1, 'School is required').max(100, 'School name too long'),
  examYear: z.number().int().min(2000, 'Exam year must be 2000 or later').max(new Date().getFullYear() + 1, 'Exam year cannot be in the future'),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
  grade: z.enum(['A', 'B', 'C', 'D', 'F'], 'Grade must be A, B, C, D, or F'),
};

// Validation schemas for endpoints
const resultsQuerySchema = z.object({
  examNumber: schemas.examNumber,
  dob: schemas.dateOfBirth,
});

const gradesStudentQuerySchema = z.object({
  examNumber: schemas.examNumber,
});

const gradesSingleSchema = z.object({
  examNumber: schemas.examNumber,
  dateOfBirth: schemas.dateOfBirth,
  studentName: schemas.studentName,
  school: schemas.school,
  examYear: z.number().optional().default(new Date().getFullYear()),
  grades: z.array(
    z.object({
      subject: schemas.subject,
      grade: schemas.grade,
    })
  ).min(1, 'At least one grade is required'),
});

const gradesBulkSchema = z.object({
  rows: z.array(
    z.object({
      examNumber: schemas.examNumber,
      dateOfBirth: schemas.dateOfBirth,
      studentName: schemas.studentName,
      school: schemas.school,
      examYear: z.number().optional().default(new Date().getFullYear()),
      subject: schemas.subject,
      grade: schemas.grade,
    })
  ).min(1, 'At least one row is required'),
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const data = req.method === 'GET' ? req.query : req.body;
      const validated = schema.parse(data);
      req.validated = validated;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      res.status(400).json({ error: 'Invalid request' });
    }
  };
};

// Consistent error response formatter
const errorResponse = (status, message, details = null) => {
  const response = {
    error: message,
    timestamp: new Date().toISOString(),
  };
  if (details) {
    response.details = details;
  }
  return response;
};

// Consistent success response formatter
const successResponse = (data, message = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  if (message) {
    response.message = message;
  }
  return response;
};

module.exports = {
  schemas,
  validate,
  resultsQuerySchema,
  gradesStudentQuerySchema,
  gradesSingleSchema,
  gradesBulkSchema,
  errorResponse,
  successResponse,
};
