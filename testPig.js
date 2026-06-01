const BASE_URL = 'http://localhost:3001/api';

async function runTest() {
  try {
    console.log('--- Starting Pig Registration Test ---');

    // 1. Authenticate (Register or Login) as a Supervisor
    const userCredentials = {
      first_name: "Test",
      last_name: "Supervisor",
      email: "supervisor_test@s-one.com",
      password: "password123",
      phone_number: "0700000099",
      role_name: "Pig Supervisor"
    };

    console.log(`\n1. Authenticating as ${userCredentials.email}...`);
    
    // Try login first
    let authResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userCredentials.email, password: userCredentials.password })
    });

    // If login fails (401), try registering
    if (authResponse.status === 401) {
      console.log('   User not found, registering new supervisor...');
      authResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userCredentials)
      });
    }

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    const token = authData.token;
    console.log('   Authentication successful. Token received.');

    // 2. Register a New Pig
    console.log('\n2. Registering a new pig...');
    const newPig = {
      name: "Test Pig 01",
      gender: "Female",
      type: "Breeding",
      batch_id: "BATCH-001",
      birth_date: "2023-01-01",
      source: "Purchased",
      initial_weight_kg: 45.5
    };

    const pigResponse = await fetch(`${BASE_URL}/pigs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'token': token // Custom header used in authorization.js
      },
      body: JSON.stringify(newPig)
    });

    if (!pigResponse.ok) {
      const errText = await pigResponse.text();
      throw new Error(`Pig registration failed: ${pigResponse.status} - ${errText}`);
    }

    const pigData = await pigResponse.json();
    console.log('   SUCCESS: Pig registered!');
    console.log('   Pig Details:', pigData);

  } catch (error) {
    console.error('\nTEST FAILED:', error.message);
  }
}

runTest();