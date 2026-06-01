const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock database - in memory
const users = [];
const organizations = [];

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'S-ONE Farm ERP API is running!' });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  try {
    const { organization_name, full_name, email, password, phone_number } = req.body;

    // Validate
    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create org
    const orgId = `org-${Date.now()}`;
    organizations.push({ id: orgId, name: organization_name || full_name });

    // Create user
    const userId = `user-${Date.now()}`;
    const user = { id: userId, email, full_name, phone_number, organizationId: orgId };
    users.push(user);

    // Mock token
    const token = `token-${Date.now()}`;

    console.log(`✓ User registered: ${email}`);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name },
      organizationId: orgId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Mock token
    const token = `token-${Date.now()}`;

    console.log(`✓ User logged in: ${email}`);
    res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name },
      organizationId: user.organizationId
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Dummy endpoints for other services
app.get('/api/farms', (req, res) => {
  res.json({ farms: [] });
});

app.get('/api/crops', (req, res) => {
  res.json({ crops: [] });
});

app.get('/api/livestock', (req, res) => {
  res.json({ livestock: [] });
});

app.get('/api/inventory', (req, res) => {
  res.json({ inventory: [] });
});

app.get('/api/finance', (req, res) => {
  res.json({ finance: [] });
});

app.get('/api/analytics/dashboard', (req, res) => {
  res.json({ 
    totalFarms: 0,
    totalCrops: 0,
    totalLivestock: 0,
    revenue: 0
  });
});

// Start server
app.listen(port, () => {
  console.log(`\n✓ Backend API running on http://localhost:${port}`);
  console.log(`✓ Ready to accept connections\n`);
});
