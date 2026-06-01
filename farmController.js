const db = require("./db");
const auditLogger = require("./auditLogger");
const cacheManager = require("./cacheManager");

exports.createFarm = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { name, location_address, location_coordinates } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Farm name is required." });
        }

        const newFarm = await db.query(
            "INSERT INTO farms (organization_id, name, location_address, location_coordinates) VALUES ($1, $2, $3, $4) RETURNING *",
            [orgId, name, location_address, location_coordinates]
        );

        // Invalidate cache
        await cacheManager.invalidateFarmList(orgId);

        await auditLogger(req, "CREATE_FARM", "farms", newFarm.rows[0].id, { name });

        res.status(201).json(newFarm.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getAllFarms = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");

        // NOTE: Caching paginated lists can be complex.
        // This is a simple example caching the main list for an organization.
        const cachedFarms = await cacheManager.getFarmList(orgId);
        if (cachedFarms) {
            return res.json(cachedFarms);
        }

        const farms = await db.query(
            "SELECT * FROM farms WHERE organization_id = $1 AND deleted_at IS NULL ORDER BY name ASC",
            [orgId]
        );

        await cacheManager.setFarmList(orgId, farms.rows);

        res.json(farms.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getFarmById = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { id } = req.params;

        const cachedFarm = await cacheManager.getFarm(id);
        if (cachedFarm) {
            return res.json(cachedFarm);
        }

        const farm = await db.query(
            "SELECT * FROM farms WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL",
            [id, orgId]
        );

        if (farm.rows.length === 0) {
            return res.status(404).json({ message: "Farm not found." });
        }

        const farmData = farm.rows[0];
        await cacheManager.setFarm(id, farmData);

        res.json(farmData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.updateFarm = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { id } = req.params;
        const { name, location_address, location_coordinates } = req.body;

        const updatedFarm = await db.query(
            "UPDATE farms SET name = $1, location_address = $2, location_coordinates = $3, updated_at = NOW() WHERE id = $4 AND organization_id = $5 AND deleted_at IS NULL RETURNING *",
            [name, location_address, location_coordinates, id, orgId]
        );

        if (updatedFarm.rows.length === 0) {
            return res.status(404).json({ message: "Farm not found." });
        }

        // Invalidate caches
        await cacheManager.invalidateFarm(id);
        await cacheManager.invalidateFarmList(orgId);

        await auditLogger(req, "UPDATE_FARM", "farms", id, { name });

        res.json(updatedFarm.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.deleteFarm = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { id } = req.params;

        // Invalidate caches before deleting
        await cacheManager.invalidateFarm(id);
        await cacheManager.invalidateFarmList(orgId);
        await cacheManager.invalidateFields(id); // Also invalidate fields associated with the farm

        await db.query(
            "UPDATE farms SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        await auditLogger(req, "DELETE_FARM", "farms", id);

        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getFieldsForFarm = async (req, res) => {
    try {
        const { id: farmId } = req.params;

        const cachedFields = await cacheManager.getFields(farmId);
        if (cachedFields) {
            return res.json(cachedFields);
        }

        const fields = await db.query(
            "SELECT * FROM fields WHERE farm_id = $1 AND deleted_at IS NULL",
            [farmId]
        );

        await cacheManager.setFields(farmId, fields.rows);
        res.json(fields.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.createField = async (req, res) => {
    // Implementation would be similar to createFarm,
    // including invalidating the fields cache:
    // await cacheManager.invalidateFields(farmId);
    res.status(501).json({ message: "Not Implemented" });
};