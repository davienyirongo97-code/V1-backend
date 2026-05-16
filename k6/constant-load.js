import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';

const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 6000,
      duration: '4m',
    },
  },
};

function getNextStudent() {
  const i = (exec.scenario.iterationInTest % 50000) + 1;
  const examNumber = String(i);
  const dob = getDobForStudent(i);
  return { examNumber, dob };
}

function getDobForStudent(i) {
  const date = new Date('2004-01-01');
  date.setDate(date.getDate() + (i - 1));
  return date.toISOString().split('T')[0];
}

export default function () {
  const student = getNextStudent();
  const url = `http://localhost:3006/api/results?examNumber=${student.examNumber}&dob=${student.dob}`;

  const res = http.get(url, {
    timeout: '60s',
    tags: { version: 'v1' },
  });

  responseTime.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has student name': (r) => r.status === 200 && r.json('student.name') !== undefined,
    'response under 60s': (r) => r.timings.duration < 60000,
  });

  sleep(Math.random() * 2 + 1); // 1-3 seconds
}
