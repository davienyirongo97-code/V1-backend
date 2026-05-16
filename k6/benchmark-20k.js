import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    benchmark_20k: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: 20000,
    },
  },
};

export default function () {
  http.get('http://localhost:3006/api/results?examNumber=1&dob=2004-01-01');
  sleep(1);
}
