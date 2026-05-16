// In-memory stats tracker for v1
const os = require('os');

const stats = {
  totalRequests:  0,
  totalServed:    0,
  total4xx:       0,
  total500:       0,
  total503:       0,
  total504:       0,
  activeRequests: 0,
  responseTimes:  [],
  methods:        { GET: 0, POST: 0, PUT: 0, DELETE: 0 },
  startTime:      Date.now(),
};

// For real-time CPU delta calculation
let lastCpuUsage = process.cpuUsage();
let lastCpuTime  = Date.now();

const recordRequest = (method = 'GET') => {
  stats.totalRequests++;
  stats.activeRequests++;
  if (stats.methods[method] !== undefined) {
    stats.methods[method]++;
  } else {
    stats.methods[method] = 1;
  }
};

const recordSuccess = (ms) => {
  stats.totalServed++;
  stats.activeRequests = Math.max(0, stats.activeRequests - 1);
  stats.responseTimes.push(ms);
  // Keep last 500 for a better average under load
  if (stats.responseTimes.length > 500) stats.responseTimes.shift();
};

const recordError = (status, ms = 0) => {
  if (status === 504) {
    stats.total504++;
  } else if (status === 503) {
    stats.total503++;
  } else if (status >= 500) {
    stats.total500++;
  } else if (status >= 400) {
    stats.total4xx++;
  }
  
  if (ms > 0) {
    stats.responseTimes.push(ms);
    if (stats.responseTimes.length > 500) stats.responseTimes.shift();
  }
  
  stats.activeRequests = Math.max(0, stats.activeRequests - 1);
};

// Legacy support for the old names
const recordTimeout = () => recordError(504);
const recordCrash   = () => recordError(500);

const getStats = () => {
  const times = stats.responseTimes;
  const avgR = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;

  const totalFailed = stats.total4xx + stats.total500 + stats.total504;
  const total = stats.totalServed + totalFailed;
  const errR = total > 0 ? Math.round((totalFailed / total) * 100) : 0;

  // Real-time CPU Usage (Delta)
  const currentCpuUsage = process.cpuUsage(lastCpuUsage);
  const currentTime = Date.now();
  const timeDeltaMs = currentTime - lastCpuTime;
  
  // Normalize by number of CPUs to get 0-100% of system capacity
  const cpuCount = os.cpus().length;
  const cpuTimeMs = (currentCpuUsage.user + currentCpuUsage.system) / 1000;
  const cpuPercent = timeDeltaMs > 0 
    ? Math.min(Math.round((cpuTimeMs / timeDeltaMs / cpuCount) * 100), 100)
    : 0;

  // Update markers for next call
  lastCpuUsage = process.cpuUsage();
  lastCpuTime  = currentTime;

  const memUsage = process.memoryUsage();
  const ramUsedMB = Math.round(memUsage.rss / 1024 / 1024);

  return {
    totalRequests:  stats.totalRequests,
    totalServed:    stats.totalServed,
    totalTimeouts:  stats.total504,
    totalCrashes:   stats.total500,
    total4xx:       stats.total4xx,
    total5xx:       stats.total500 + stats.total504,
    totalFailed:    totalFailed,
    activeRequests: stats.activeRequests,
    avgResponseMs:  avgR,
    errorRate:      errR,
    uptimeSeconds:  Math.floor((Date.now() - stats.startTime) / 1000),
    ramUsedMB,
    cpuPercent,
    methods:        stats.methods,
  };
};

module.exports = { recordRequest, recordSuccess, recordError, recordTimeout, recordCrash, getStats };

