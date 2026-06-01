const db = require("./db");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("./jwtGenerator");
const auditLogger = require("./auditLogger");

// Register Organization and Owner (SaaS Signup)
exports.register = async (req, res) => {
  const client = await db.getClient();
  try {
    const { organization_name, full_name, email, password, phone_number } = req.body;

    // Validation
    if (!email || !password || !organization_name || !full_name) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query('BEGIN');

    // 1. Check if user exists
    const userExist = await client.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ message: "User already exists" });
    }

    // 2. Hash password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 3. Create Organization
    const newOrg = await client.query(
        "INSERT INTO organizations (name) VALUES ($1) RETURNING id, name",
        [organization_name]
    );
    const orgId = newOrg.rows[0].id;

    // 4. Create User
    const newUser = await client.query(
      "INSERT INTO users (full_name, email, password_hash, phone_number) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email",
      [full_name, email, bcryptPassword, phone_number]
    );
    const userId = newUser.rows[0].id;

    // 5. Assign 'Farm Owner' role
    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'Farm Owner'");
    if (roleRes.rows.length === 0) {
        throw new Error("Role 'Farm Owner' not found in database seeds.");
    }
    const roleId = roleRes.rows[0].id;

    await client.query(
        "INSERT INTO user_organization_roles (user_id, organization_id, role_id) VALUES ($1, $2, $3)",
        [userId, orgId, roleId]
    );

    await client.query('COMMIT');

    // 6. Generate Token
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    await auditLogger(req, "REGISTER_ORG", "organizations", orgId, { name: organization_name });

    res.json({
        accessToken,
        refreshToken,
        user: { 
            id: userId, 
            email, 
            full_name, 
            organization: { id: orgId, name: organization_name, role: 'Farm Owner' } 
        } 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Password or Email is incorrect" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Password or Email is incorrect" });
    }

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.rows[0].id]);

    const accessToken = generateAccessToken(user.rows[0].id);
    const refreshToken = generateRefreshToken(user.rows[0].id);

    // Store refresh token hash (simplified for this phase, storing token directly for MVP)
    // In production, hash this token before storing.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.rows[0].id, refreshToken, expiresAt]
    );

    await auditLogger(req, "LOGIN", "users", user.rows[0].id);

    res.json({ accessToken, refreshToken });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Refresh Token
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Refresh Token required" });

    // 1. Check DB
    const tokenRes = await db.query("SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE", [refreshToken]);
    if (tokenRes.rows.length === 0) {
        return res.status(403).json({ message: "Invalid Refresh Token" });
    }

    const storedToken = tokenRes.rows[0];
    if (new Date() > new Date(storedToken.expires_at)) {
        return res.status(403).json({ message: "Refresh Token expired" });
    }

    // 2. Generate new Access Token
    const newAccessToken = generateAccessToken(storedToken.user_id);

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get Current User Profile (Me)
exports.getMe = async (req, res) => {
  try {
    // req.user.id comes from middleware
    const userRes = await db.query(
        "SELECT id, full_name, email, phone_number, is_active, created_at FROM users WHERE id = $1", 
        [req.user.id]
    );
    
    if (userRes.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    // Fetch organizations and roles
    const orgsRes = await db.query(
        `SELECT o.id, o.name, r.name as role 
         FROM organizations o
         JOIN user_organization_roles uor ON o.id = uor.organization_id
         JOIN roles r ON uor.role_id = r.id
         WHERE uor.user_id = $1`,
        [req.user.id]
    );

    res.json({
        ...userRes.rows[0],
        organizations: orgsRes.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};