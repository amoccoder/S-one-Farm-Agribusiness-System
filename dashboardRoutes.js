const router = require("express").Router();
const dashboardController = require("./dashboardController");
const authorization = require("./authorization");

// Dashboard metrics
router.get("/", authorization, dashboardController.getDashboardMetrics);

module.exports = router;