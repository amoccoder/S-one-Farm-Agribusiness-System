const promClient = require('prom-client');

// Collect default metrics (CPU, Memory, etc.)
promClient.collectDefaultMetrics();

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
});

const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
});

const queueJobsTotal = new promClient.Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue_name', 'status'],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

const queueJobDuration = new promClient.Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue jobs in seconds',
  labelNames: ['queue_name', 'status'],
  buckets: [0.1, 0.5, 1, 5, 10, 30],
});

// Middleware to track HTTP requests
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    // Use req.route.path if available to avoid cardinality explosion with parameters
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });

  next();
}

// Metrics endpoint handler
async function metricsEndpoint(req, res) {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  httpRequestDuration,
  httpRequestTotal,
  cacheHits,
  cacheMisses,
  queueJobsTotal,
  databaseQueryDuration,
  queueJobDuration,
};