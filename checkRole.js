const db = require("./db");

module.exports = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const orgId = req.header("Organization-Id");
      
      // If the route requires a role, it implies it's an org-specific operation
      if (!orgId) {
          return res.status(400).json({ message: "Organization-Id header is required for this operation" });
      }

      const result = await db.query(
        `SELECT r.name 
         FROM user_organization_roles uor
         JOIN roles r ON uor.role_id = r.id
         WHERE uor.user_id = $1 AND uor.organization_id = $2`,
        [req.user.id, orgId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ message: "User is not a member of this organization" });
      }

      const userRole = result.rows[0].name;

      if (allowedRoles.includes(userRole) || userRole === 'Super Admin') {
        next();
      } else {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  };
};