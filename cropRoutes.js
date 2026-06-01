const router = require("express").Router();
const cropController = require("./cropController");
const authorization = require("./authorization");
const checkRole = require("./checkRole");

const managerRoles = ['Super Admin', 'Farm Owner', 'Farm Manager'];
const generalAccess = ['Super Admin', 'Farm Owner', 'Farm Manager', 'Worker'];

// Crop Catalog
router.route("/crops")
    .get(authorization, checkRole(generalAccess), cropController.getAllCrops)
    .post(authorization, checkRole(managerRoles), cropController.createCrop);

router.route("/crops/:id")
    .get(authorization, checkRole(generalAccess), cropController.getCropById)
    .put(authorization, checkRole(managerRoles), cropController.updateCrop)
    .delete(authorization, checkRole(managerRoles), cropController.deleteCrop);

// Plantings
router.route("/plantings")
    .get(authorization, checkRole(generalAccess), cropController.getAllPlantings)
    .post(authorization, checkRole(managerRoles), cropController.createPlanting);

router.route("/plantings/:id")
    .get(authorization, checkRole(generalAccess), cropController.getPlantingById)
    .put(authorization, checkRole(managerRoles), cropController.updatePlanting);

// Harvests
router.route("/harvests")
    .get(authorization, checkRole(generalAccess), cropController.getAllHarvests)
    .post(authorization, checkRole(managerRoles), cropController.recordHarvest);

module.exports = router;