const routes = [
  '/',
  '/create',
  '/trending',
  '/search',
  '/settings',
  '/profile', // This might redirect to login if no auth, let's check
  '/hyderabad',
  '/hitech-city',
  '/gachibowli',
  '/madhapur',
  '/kondapur',
  '/miyapur',
  '/kukatpally'
];

async function runAudit() {
  console.log('--- STARTING RAMBHAHOO ROUTE AUDIT ---');
  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`, { redirect: 'manual' });
      console.log(`Route: ${route} | Status: ${res.status}`);
    } catch (e) {
      console.error(`Route: ${route} | Error: ${e.message}`);
    }
  }
  console.log('--- AUDIT COMPLETE ---');
}

runAudit();
