import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';

// ── Custom metrics ──────────────────────────────────────────
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

// ── Test configuration ──────────────────────────────────────
// Simulates a results day spike:
// - Ramp up to 5000 students over 3 minutes

export const options = {
  stages: [
    { duration: '5m', target: 10000 },  // ramp up
  ],
  thresholds: {
    // v1 will fail these — that is the point
    http_req_duration: ['p(95)<30000'], // 95% of requests under 30s
    error_rate: ['rate<0.5'],    // less than 50% errors
  },
};

// ── Real student exam numbers from the database ─────────────
const REAL_STUDENTS = [
  { examNumber: '1', dob: '2004-01-01' },
  { examNumber: '2', dob: '2004-01-02' },
  { examNumber: '3', dob: '2004-01-03' },
  { examNumber: '4', dob: '2004-01-04' },
  { examNumber: '5', dob: '2004-01-05' },
  { examNumber: '6', dob: '2004-01-06' },
  { examNumber: '7', dob: '2004-01-07' },
  { examNumber: '8', dob: '2004-01-08' },
];

// ── Helper: pick a random student ───────────────────────────
function getNextStudent() {
  // Use the global iteration index to pick a student sequentially
  // iterationInTest starts at 0, so we add 1 to match your DB starting at 1
  const i = (exec.scenario.iterationInTest % 50000) + 1;
  const examNumber = String(i);
  const dob = getDobForStudent(i);
  return { examNumber, dob };
}

// ── Helper: calculate DOB based on incremental pattern ────────
function getDobForStudent(i) {
  const date = new Date('2004-01-01');
  date.setDate(date.getDate() + (i - 1));
  return date.toISOString().split('T')[0];
}

// ── Main test function (runs once per virtual user per iteration)
export default function () {
  const student = getNextStudent();

  const url = `http://localhost:3006/api/results?examNumber=${student.examNumber}&dob=${student.dob}`;

  const res = http.get(url, {
    timeout: '60s',
    tags: { version: 'v1' },
  });

  // ── Record metrics ────────────────────────────────────────
  responseTime.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  // ── Validate response ─────────────────────────────────────
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has student name': (r) => r.status === 200 && r.json('student.name') !== undefined,
    'has 9 results': (r) => r.status === 200 && r.json('results') && r.json('results').length === 9,
    'response under 60s': (r) => r.timings.duration < 60000,
  });

  // ── Think time between requests ───────────────────────────
  // Simulates a student waiting before searching again
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}
