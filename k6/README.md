# K6 Load Testing — MANEB Exam Results System

This folder contains load test scripts for all 3 versions of the system.
The same script is used for all versions — what changes is the backend being tested.

---

## What K6 Does

K6 simulates thousands of students hitting the results portal at the same time.
It fires real HTTP requests at the backend API and records how the system performs.

The goal is to compare v1, v2 and v3 under the same load and show the improvement.

---

## Installation

Download and install K6 from:
```
https://k6.io/docs/get-started/installation/
```

For Windows, download the installer from the releases page.

Verify installation:
```bash
k6 version
```

---

## Requirements Before Running

1. Backend API must be running on `http://localhost:3006`
2. PostgreSQL database must be running with 450,000 rows loaded
3. K6 must be installed

---

## How to Run

**Test v1:**
```bash
k6 run --out json=k6/results-v1.json k6/spike-test.js
```

**Test v2:**
```bash
k6 run --out json=k6/results-v2.json k6/spike-test.js
```

**Test v3:**
```bash
k6 run --out json=k6/results-v3.json k6/spike-test.js
```

---

## Test Stages

The test simulates a real results day:

| Stage | Duration | Users | Description |
|---|---|---|---|
| Ramp up | 3 minutes | 0 → 5000 | Students start checking results |
| Peak | 5 minutes | 5000 | Maximum load — results day rush |
| Ramp down | 2 minutes | 5000 → 0 | Traffic dies down |

Total test duration: 10 minutes per version.

---

## What K6 Measures

- `http_req_duration` — how long each request takes
- `http_req_failed` — how many requests failed
- `error_rate` — percentage of failed requests
- `response_time` — custom metric tracking response times
- `checks` — whether responses contain valid data

---

## Expected Results

| Metric | v1 (unoptimised) | v2 (Redis) | v3 (CDN) |
|---|---|---|---|
| Avg response time | 30-60s | 1-3s | <100ms |
| Error rate | 60-90% | 5-10% | <1% |
| Timeouts | Many | Few | Almost none |

v1 is expected to fail the thresholds — that is the point.
The failing numbers prove the system needs optimisation.

---

## Files

| File | Description |
|---|---|
| `spike-test.js` | Main test script — used for all versions |
| `results-v1.json` | Results from testing v1 (generated after running) |
| `results-v2.json` | Results from testing v2 (generated after running) |
| `results-v3.json` | Results from testing v3 (generated after running) |
