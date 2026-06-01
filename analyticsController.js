const db = require("./db");
const cacheManager = require("./cacheManager");

exports.getOverviewDashboard = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const dashboardName = 'overview';

        // 1. Check cache first
        const cachedData = await cacheManager.getDashboardMetrics(orgId, dashboardName);
        if (cachedData) {
            return res.json(cachedData);
        }

        // 2. If not in cache, query the database
        // These queries would be complex in a real scenario, joining across tables.
        // For this implementation, we'll use simplified queries.
        const salesPromise = db.query("SELECT SUM(amount) as total_sales FROM sales WHERE organization_id = $1", [orgId]);
        const expensesPromise = db.query("SELECT SUM(amount) as total_expenses FROM expenses WHERE organization_id = $1", [orgId]);
        const livestockCountPromise = db.query("SELECT COUNT(*) as total_livestock FROM livestock WHERE organization_id = $1 AND status = 'Active'", [orgId]);
        const activePlantingsPromise = db.query("SELECT COUNT(*) as active_plantings FROM plantings WHERE organization_id = $1 AND status = 'Active'", [orgId]);

        const [salesRes, expensesRes, livestockRes, plantingsRes] = await Promise.all([
            salesPromise,
            expensesPromise,
            livestockCountPromise,
            activePlantingsPromise
        ]);

        const totalSales = parseFloat(salesRes.rows[0].total_sales) || 0;
        const totalExpenses = parseFloat(expensesRes.rows[0].total_expenses) || 0;

        const dashboardData = {
            total_sales: totalSales,
            total_expenses: totalExpenses,
            net_profit: totalSales - totalExpenses,
            total_livestock: parseInt(livestockRes.rows[0].total_livestock, 10) || 0,
            active_plantings: parseInt(plantingsRes.rows[0].active_plantings, 10) || 0,
            generated_at: new Date().toISOString()
        };

        // 3. Store the result in cache for future requests
        await cacheManager.setDashboardMetrics(orgId, dashboardName, dashboardData);

        res.json(dashboardData);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};