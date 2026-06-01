const db = require("./db");

exports.getDashboardMetrics = async (req, res) => {
    try {
        const [
            totalPigsRes,
            breedingPigsRes,
            fatteningPigsRes,
            pigletsRes,
            deadPigsRes,
            allPigsRes,
            totalBirdsRes,
            dailyEggsRes,
            dailyFeedRes,
            totalDeadBirdsRes,
            totalInitialBirdsRes,
            avgPigWeightRes,
            weeklyEggsRes
        ] = await Promise.all([
            // Pig Metrics
            db.query("SELECT COUNT(*) FROM pigs WHERE status = 'Alive'"),
            db.query("SELECT COUNT(*) FROM pigs WHERE type = 'Breeding' AND status = 'Alive'"),
            db.query("SELECT COUNT(*) FROM pigs WHERE type = 'Fattening' AND status = 'Alive'"),
            db.query(`
                SELECT SUM(piglets_born_alive) 
                FROM breeding_records 
                WHERE EXTRACT(MONTH FROM actual_farrowing_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM actual_farrowing_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            `),
            db.query("SELECT COUNT(*) FROM pigs WHERE status = 'Dead'"),
            db.query("SELECT COUNT(*) FROM pigs"),
            // Poultry Metrics
            db.query("SELECT SUM(current_bird_count) FROM flocks WHERE status = 'Active'"),
            db.query("SELECT SUM(total_eggs_collected) FROM daily_egg_production WHERE record_date = CURRENT_DATE"),
            db.query("SELECT SUM(quantity_used_kg) FROM poultry_feed_records WHERE record_date = CURRENT_DATE"),
            db.query("SELECT COALESCE(SUM(birds_dead), 0) as sum FROM poultry_mortality"),
            db.query("SELECT COALESCE(SUM(initial_bird_count), 0) as sum FROM flocks"),
            // New Pig Metric
            db.query(`
                SELECT AVG(latest_weights.weight_kg) as average_weight
                FROM (
                    SELECT DISTINCT ON (pig_id) weight_kg FROM pig_weights ORDER BY pig_id, date_recorded DESC
                ) as latest_weights
            `),
            // New Poultry Metric
            db.query("SELECT SUM(total_eggs_collected) as sum FROM daily_egg_production WHERE record_date >= CURRENT_DATE - INTERVAL '7 days'")
        ]);

        // --- Pig Calculations ---
        const allPigsCount = parseInt(allPigsRes.rows[0].count);
        const deadPigsCount = parseInt(deadPigsRes.rows[0].count);
        const pigMortalityRate = allPigsCount > 0 
            ? ((deadPigsCount / allPigsCount) * 100).toFixed(2) 
            : 0;
        
        // --- Poultry Calculations ---
        const totalActiveBirds = parseInt(totalBirdsRes.rows[0].sum) || 0;
        const totalEggsToday = parseInt(dailyEggsRes.rows[0].sum) || 0;
        const henDayPercentage = totalActiveBirds > 0
            ? ((totalEggsToday / totalActiveBirds) * 100).toFixed(2)
            : 0;

        const totalInitialBirds = parseInt(totalInitialBirdsRes.rows[0].sum) || 0;
        const totalDeadBirds = parseInt(totalDeadBirdsRes.rows[0].sum) || 0;
        const poultryMortalityRate = totalInitialBirds > 0
            ? ((totalDeadBirds / totalInitialBirds) * 100).toFixed(2)
            : 0;

        res.json({
            pigs: {
                total_pigs: parseInt(totalPigsRes.rows[0].count),
                breeding_pigs: parseInt(breedingPigsRes.rows[0].count),
                fattening_pigs: parseInt(fatteningPigsRes.rows[0].count),
                piglets_born_this_month: parseInt(pigletsRes.rows[0].sum) || 0,
                mortality_rate: parseFloat(pigMortalityRate),
                average_weight_kg: parseFloat(avgPigWeightRes.rows[0].average_weight).toFixed(2) || 0,
            },
            poultry: {
                total_birds: totalActiveBirds,
                daily_eggs_produced: totalEggsToday,
                weekly_eggs_produced: parseInt(weeklyEggsRes.rows[0].sum) || 0,
                hen_day_percentage: parseFloat(henDayPercentage),
                feed_consumption_today_kg: parseFloat(dailyFeedRes.rows[0].sum) || 0,
                mortality_rate: parseFloat(poultryMortalityRate)
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};