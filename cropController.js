const db = require("./db");
const auditLogger = require("./auditLogger");
const cacheManager = require("./cacheManager");

// --- Crop Catalog Management ---

exports.createCrop = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { name, variety, scientific_name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Crop name is required." });
        }

        const newCrop = await db.query(
            "INSERT INTO crops (organization_id, name, variety, scientific_name) VALUES ($1, $2, $3, $4) RETURNING *",
            [orgId, name, variety, scientific_name]
        );

        // Invalidate cache
        await cacheManager.invalidateCropCatalog(orgId);

        await auditLogger(req, "CREATE_CROP", "crops", newCrop.rows[0].id, { name });

        res.status(201).json(newCrop.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getAllCrops = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");

        const cachedCrops = await cacheManager.getCropCatalog(orgId);
        if (cachedCrops) {
            return res.json(cachedCrops);
        }

        const crops = await db.query(
            "SELECT * FROM crops WHERE organization_id = $1 AND deleted_at IS NULL ORDER BY name ASC",
            [orgId]
        );

        await cacheManager.setCropCatalog(orgId, crops.rows);

        res.json(crops.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getCropById = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { id } = req.params;
        const crop = await db.query(
            "SELECT * FROM crops WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL",
            [id, orgId]
        );
        if (crop.rows.length === 0) {
            return res.status(404).json({ message: "Crop not found." });
        }
        res.json(crop.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.updateCrop = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { id } = req.params;
        const { name, variety, scientific_name } = req.body;

        const updatedCrop = await db.query(
            "UPDATE crops SET name = $1, variety = $2, scientific_name = $3, updated_at = NOW() WHERE id = $4 AND organization_id = $5 AND deleted_at IS NULL RETURNING *",
            [name, variety, scientific_name, id, orgId]
        );

        if (updatedCrop.rows.length === 0) {
            return res.status(404).json({ message: "Crop not found." });
        }

        await cacheManager.invalidateCropCatalog(orgId);
        await auditLogger(req, "UPDATE_CROP", "crops", id, { name });

        res.json(updatedCrop.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.deleteCrop = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { id } = req.params;

        await db.query(
            "UPDATE crops SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        await cacheManager.invalidateCropCatalog(orgId);
        await auditLogger(req, "DELETE_CROP", "crops", id);

        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// --- Plantings & Harvests ---

exports.createPlanting = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { field_id, crop_id, planting_date, expected_harvest_date, status } = req.body;

        const newPlanting = await db.query(
            "INSERT INTO plantings (organization_id, field_id, crop_id, planting_date, expected_harvest_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [orgId, field_id, crop_id, planting_date, expected_harvest_date, status || 'Active']
        );

        await cacheManager.invalidatePlantingSchedules(field_id);
        await auditLogger(req, "CREATE_PLANTING", "plantings", newPlanting.rows[0].id, { field_id, crop_id });

        res.status(201).json(newPlanting.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getAllPlantings = async (req, res) => {
    try {
        const orgId = req.header("Organization-Id");
        const { field_id } = req.query;

        if (field_id) {
            const cachedPlantings = await cacheManager.getPlantingSchedules(field_id);
            if (cachedPlantings) return res.json(cachedPlantings);
        }

        let query = "SELECT * FROM plantings WHERE organization_id = $1 AND deleted_at IS NULL";
        const params = [orgId];
        if (field_id) {
            query += " AND field_id = $2";
            params.push(field_id);
        }
        query += " ORDER BY planting_date DESC";

        const plantings = await db.query(query, params);

        if (field_id) await cacheManager.setPlantingSchedules(field_id, plantings.rows);

        res.json(plantings.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

exports.getPlantingById = async (req, res) => res.status(501).json({ message: "Not Implemented" });
exports.updatePlanting = async (req, res) => res.status(501).json({ message: "Not Implemented" });
exports.getAllHarvests = async (req, res) => res.status(501).json({ message: "Not Implemented" });
exports.recordHarvest = async (req, res) => res.status(501).json({ message: "Not Implemented" });