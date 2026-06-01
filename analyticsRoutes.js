const router = require("express").Router();
const analyticsController = require("./analyticsController");
const authorization = require("./authorization");
const checkRole = require("./checkRole");

const managerRoles = ['Super Admin', 'Farm Owner', 'Farm Manager', 'Accountant'];

router.route("/dashboard/overview")
    .get(authorization, checkRole(managerRoles), analyticsController.getOverviewDashboard);

module.exports = router;