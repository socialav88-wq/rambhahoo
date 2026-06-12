const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vtszkowjjwkdxxgufgie.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0c3prb3dqandrZHh4Z3VmZ2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTEwNTMsImV4cCI6MjA5MjU4NzA1M30.aA9_xcw2cbzPqPU8DDgC-drwxh6VNQyAVUgmDAHnzls';

async function checkSchema() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    const openapi = await res.json();
    console.log('OpenAPI Definitions:', Object.keys(openapi.definitions || {}));
    console.log('Posts Schema:', openapi.definitions?.posts?.properties || 'Not found');
  } catch (e) {
    console.error(e);
  }
}

checkSchema();
