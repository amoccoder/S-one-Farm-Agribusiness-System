const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cacheManager = require('./cacheManager');
const { metricsMiddleware, metricsEndpoint } = require('../metrics');

const app = express();
const port = process.env.PORT || 3002;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

// --- API Routes ---
app.use("/", require("./farmRoutes"));

// --- Health Check ---
app.get('/health', (req, res) => {
    const cacheStatus = cacheManager.getStatus();
    res.status(200).json({
        status: 'UP',
        service: 'Farm Service',
        cache: cacheStatus
    });
});

// --- Metrics Endpoint ---
app.get('/metrics', metricsEndpoint);

async function startServer() {
    await cacheManager.connect();

    const server = app.listen(port, () => {
        console.log(`Farm Service running on port ${port}`);
    });

    const shutdown = async () => {
        console.log('Shutting down Farm Service...');
        await cacheManager.disconnect();
        server.close(() => { console.log('Farm Service has been shut down.'); process.exit(0); });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

startServer();