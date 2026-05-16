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

export default function () {
  http.get('http://localhost:3006/api/results?examNumber=1&dob=2004-01-01');
  sleep(1);
}
