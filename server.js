const express = require('express');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const resultsRouter = require('./routes/results');
const gradesRouter  = require('./routes/grades');
const { getStats } = require('./stats');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/results', resultsRouter);
app.use('/api/grades',  gradesRouter);

// Real-time stats endpoint — polled by admin dashboard
app.get('/api/stats', (req, res) => {
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();

  // CPU usage — average load across all cores
  const loadAvg = os.loadavg()[0]; // 1 min average
  const cpuCount = cpus.length;
  const cpuPct = Math.min(Math.round((loadAvg / cpuCount) * 100), 100);

  res.json({
    ...getStats(),
    system: {
      cpuPercent:     cpuPct,
      ramUsedMB:      Math.round(usedMem / 1024 / 1024),
      ramTotalMB:     Math.round(totalMem / 1024 / 1024),
      ramPercent:     Math.round((usedMem / totalMem) * 100),
      nodeHeapMB:     Math.round(mem.heapUsed / 1024 / 1024),
      nodeHeapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: 'v1', timestamp: new Date().toISOString() });
});

// MANEB v1 Backend - Use with K6 load test scripts in /k6
app.listen(PORT, () => {
  console.log(`MANEB v1 backend running on http://localhost:${PORT}`);
});
