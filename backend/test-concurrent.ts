

async function runTest() {
  const NUM_USERS = 100;
  const baseUrl = 'http://localhost:3000';
  
  console.log(`Starting concurrent registration test for ${NUM_USERS} users...`);
  
  // Prepare payload
  const users = Array.from({ length: NUM_USERS }).map((_, i) => ({
    email: `test_${Math.random().toString(36).substring(7)}@example.com`,
    password: 'password123',
    name: `User ${i}`,
    phone: `012345678${i}`,
    role: 'TENANT'
  }));

  const startTimeReg = Date.now();
  
  // Send concurrent registration requests
  const regPromises = users.map(user => 
    fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).then(async res => {
      const data = await res.json();
      return { status: res.status, email: user.email, data };
    }).catch(err => ({ status: 500, error: err.message }))
  );

  const regResults = await Promise.all(regPromises);
  const endTimeReg = Date.now();
  
  const regSuccess = regResults.filter(r => r.status === 201).length;
  console.log(`\nRegistration Result:`);
  console.log(`- Total Time: ${endTimeReg - startTimeReg}ms`);
  console.log(`- Success: ${regSuccess}/${NUM_USERS}`);
  if (regSuccess !== NUM_USERS) {
     console.log(`- First failed result:`, regResults.find(r => r.status !== 201));
  }

  console.log(`\n--------------------------------\n`);
  console.log(`Starting concurrent login test for ${NUM_USERS} users...`);

  const startTimeLogin = Date.now();

  const loginPromises = users.map(user => 
    fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password })
    }).then(async res => {
      const data = await res.json();
      return { status: res.status, email: user.email };
    }).catch(err => ({ status: 500, error: err.message }))
  );

  const loginResults = await Promise.all(loginPromises);
  const endTimeLogin = Date.now();

  const loginSuccess = loginResults.filter(r => r.status === 201 || r.status === 200).length;
  console.log(`\nLogin Result:`);
  console.log(`- Total Time: ${endTimeLogin - startTimeLogin}ms`);
  console.log(`- Success: ${loginSuccess}/${NUM_USERS}`);
  if (loginSuccess !== NUM_USERS) {
     console.log(`- First failed result:`, loginResults.find(r => r.status !== 201 && r.status !== 200));
  }
}

runTest();
