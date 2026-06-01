const router = require("express").Router();
const userController = require("./userController");
const authorization = require("./authorization");
const checkRole = require("./checkRole");

const adminRoles = ['Super Admin', 'Farm Director'];

router.route("/")
    .get(authorization, checkRole(adminRoles), userController.getAllUsers)
    .post(authorization, checkRole(adminRoles), userController.createUser);

router.route("/:id")
    .patch(authorization, checkRole(adminRoles), userController.updateUser)
    .delete(authorization, checkRole(adminRoles), userController.deleteUser);

module.exports = router;