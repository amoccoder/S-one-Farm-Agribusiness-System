const request = require('supertest');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const app = require('../index');

// --- Test Configuration ---
const testDbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 's_one_farm',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
};

const jwtSecret = process.env.JWT_SECRET || 'your_very_secure_and_long_jwt_secret_key_that_is_not_this';

let dbPool;

// --- Helper Functions ---
const generateToken = (userId, email) => {
    return jwt.sign(
        { user: { id: userId, email: email } },
        jwtSecret,
        { expiresIn: '1h' }
    );
};

describe('Analytics Service Integration', () => {
    
    beforeAll(() => {
        dbPool = new Pool(testDbConfig);
    });

    afterAll(async () => {
        await dbPool.end();
    });

    // Clean up data before each test
    beforeEach(async () => {
        await dbPool.query('DELETE FROM sales');
        await dbPool.query('DELETE FROM expenses');
        await dbPool.query('DELETE FROM livestock');
        await dbPool.query('DELETE FROM plantings');
        await dbPool.query('DELETE FROM user_organization_roles');
        await dbPool.query('DELETE FROM roles');
    });

    test('GET /dashboard/overview should return aggregated metrics for authorized user', async () => {
        // 1. ARRANGE: Seed Data
        const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        const userId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
        const token = generateToken(userId, 'test@example.com');

        // Seed Role
        const roleRes = await dbPool.query("INSERT INTO roles (name, description) VALUES ('Farm Manager', 'Manager role') RETURNING id");
        const roleId = roleRes.rows[0].id;

        // Assign Role to User
        await dbPool.query(
            "INSERT INTO user_organization_roles (user_id, organization_id, role_id) VALUES ($1, $2, $3)",
            [userId, orgId, roleId]
        );

        // Seed Financial Data (Sales & Expenses)
        await dbPool.query(
            "INSERT INTO sales (organization_id, sale_date, item_details, amount) VALUES ($1, NOW(), '{\"item\":\"Corn\"}', 5000), ($1, NOW(), '{\"item\":\"Wheat\"}', 3000)",
            [orgId]
        );
        await dbPool.query(
            "INSERT INTO expenses (organization_id, expense_date, category, amount) VALUES ($1, NOW(), 'Feed', 1000), ($1, NOW(), 'Labor', 1500)",
            [orgId]
        );

        // Seed Livestock (Active and Sold/Dead)
        // Assuming livestock table has 'status' column
        // We need farm_id for livestock usually, but analytics might just check org_id depending on constraints
        // For simplicity, we create minimal valid records.
        // Note: In a real environment, foreign keys to farms/crops might need seeding too.
        // For this test, we assume the simplified query in controller doesn't join on those tables strictly for counts.
        await dbPool.query(
            "INSERT INTO livestock (organization_id, farm_id, tag_id, species, breed, birth_date, gender, status) VALUES ($1, $1, 'TAG1', 'Pig', 'Landrace', '2023-01-01', 'Male', 'Active')",
            [orgId]
        );
         await dbPool.query(
            "INSERT INTO livestock (organization_id, farm_id, tag_id, species, breed, birth_date, gender, status) VALUES ($1, $1, 'TAG2', 'Pig', 'Landrace', '2023-01-01', 'Female', 'Sold')",
            [orgId]
        );

        // Seed Plantings
        await dbPool.query(
             "INSERT INTO plantings (organization_id, field_id, crop_id, planting_date, status) VALUES ($1, $1, $1, NOW(), 'Active'), ($1, $1, $1, NOW(), 'Harvested')",
             [orgId]
        );

        // 2. ACT
        const response = await request(app)
            .get('/dashboard/overview')
            .set('token', token)
            .set('Organization-Id', orgId);

        // 3. ASSERT
        expect(response.status).toBe(200);
        
        const data = response.body;
        
        // Sales: 5000 + 3000 = 8000
        expect(data.total_sales).toBe(8000);
        
        // Expenses: 1000 + 1500 = 2500
        expect(data.total_expenses).toBe(2500);
        
        // Net Profit: 8000 - 2500 = 5500
        expect(data.net_profit).toBe(5500);

        // Counts (Active only)
        expect(data.total_livestock).toBe(1);
        expect(data.active_plantings).toBe(1);
    });
});