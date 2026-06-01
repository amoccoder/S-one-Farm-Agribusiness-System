const db = require("./db");

const auditLogger = async (req, action, targetEntity = null, targetId = null, details = null) => {
  try {
    const userId = req.user ? req.user.id : null;
    // Organization ID might be passed in headers for tenant-specific actions
    const orgId = req.header("Organization-Id") || null; 
    const ip = req.ip || req.connection.remoteAddress;

    await db.query(
      `INSERT INTO audit_logs (organization_id, user_id, action, target_entity, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, userId, action, targetEntity, targetId, details, ip]
    );
  } catch (err) {
    // Fail silently to avoid blocking the main request, but log to console
    console.error("Audit Log Error:", err.message);
  }
};

module.exports = auditLogger;