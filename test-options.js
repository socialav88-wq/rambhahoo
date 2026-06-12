const NEXT_PUBLIC_SUPABASE_URL = 'https://vtszkowjjwkdxxgufgie.supabase.co';
const NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0c3prb3dqandrZHh4Z3VmZ2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTEwNTMsImV4cCI6MjA5MjU4NzA1M30.aA9_xcw2cbzPqPU8DDgC-drwxh6VNQyAVUgmDAHnzls';

async function getOptions() {
  const res = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  });
  
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    // In PostgREST >= 10, OpenAPI is under components.schemas or definitions
    const schemas = json.components?.schemas || json.definitions;
    if (schemas && schemas.posts) {
      console.log('EXACT COLUMNS IN POSTGREST CACHE FOR POSTS:');
      console.log(Object.keys(schemas.posts.properties));
    } else {
      console.log('Could not parse posts schema from OpenAPI:', Object.keys(schemas || {}));
    }
  } catch (e) {
    console.log(e);
  }
}

getOptions();
