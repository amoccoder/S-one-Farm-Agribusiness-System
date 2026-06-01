const router = require("express").Router();
const farmController = require("./farmController");
const authorization = require("./authorization");
const checkRole = require("./checkRole");

const managerRoles = ['Super Admin', 'Farm Owner', 'Farm Manager'];
const generalAccess = ['Super Admin', 'Farm Owner', 'Farm Manager', 'Worker'];

// Farm CRUD
router.route("/")
    .get(authorization, checkRole(generalAccess), farmController.getAllFarms)
    .post(authorization, checkRole(managerRoles), farmController.createFarm);

router.route("/:id")
    .get(authorization, checkRole(generalAccess), farmController.getFarmById)
    .put(authorization, checkRole(managerRoles), farmController.updateFarm)
    .delete(authorization, checkRole(managerRoles), farmController.deleteFarm);

// Field CRUD (nested under a farm)
router.route("/:id/fields")
    .get(authorization, checkRole(generalAccess), farmController.getFieldsForFarm)
    .post(authorization, checkRole(managerRoles), farmController.createField);

module.exports = router;