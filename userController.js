const db = require("./db");
const bcrypt = require("bcrypt");

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await db.query(
            "SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.is_active, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC"
        );
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Create a new user (Admin function)
exports.createUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone_number, role_name } = req.body;

        const userExist = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExist.rows.length > 0) {
            return res.status(401).json({ message: "User already exists" });
        }

        // Get Role ID
        let roleResult = await db.query("SELECT id FROM roles WHERE name = $1", [role_name || 'Worker']);
        if (roleResult.rows.length === 0) {
             return res.status(400).json({ message: "Invalid Role" });
        }
        const role_id = roleResult.rows[0].id;

        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            "INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, role_id",
            [first_name, last_name, email, bcryptPassword, phone_number, role_id]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Update user (e.g. Change Role or Deactivate)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role_name, is_active } = req.body;

        let query = "UPDATE users SET updated_at = NOW()";
        const params = [id];
        let paramCount = 1;

        if (role_name) {
            const roleResult = await db.query("SELECT id FROM roles WHERE name = $1", [role_name]);
            if (roleResult.rows.length > 0) {
                paramCount++;
                query += `, role_id = $${paramCount}`;
                params.push(roleResult.rows[0].id);
            }
        }

        if (typeof is_active === 'boolean') {
            paramCount++;
            query += `, is_active = $${paramCount}`;
            params.push(is_active);
        }

        query += ` WHERE id = $1 RETURNING id, email, is_active`;

        const updatedUser = await db.query(query, params);

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM users WHERE id = $1", [id]);
        res.json({ message: "User deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};