import http from 'k6/http';
import { check, sleep } from 'k6';

import { Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';

const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

export const options = {
  scenarios: {
    benchmark_20k: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: 20000,
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<30000'],
    error_rate: ['rate<0.5'],
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
  const res = http.get(`http://localhost:3006/api/results?examNumber=${student.examNumber}&dob=${student.dob}`);
  
  responseTime.add(res.timings.duration);
  errorRate.add(res.status !== 200);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has student name': (r) => r.status === 200 && r.json('student.name') !== undefined,
    'has 9 results': (r) => r.status === 200 && r.json('results') && r.json('results').length === 9,
    'response under 60s': (r) => r.timings.duration < 60000,
  });
  
  sleep(1);
}
