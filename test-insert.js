const { createClient } = require('@supabase/supabase-js');

const NEXT_PUBLIC_SUPABASE_URL = 'https://vtszkowjjwkdxxgufgie.supabase.co';
const NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0c3prb3dqandrZHh4Z3VmZ2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTEwNTMsImV4cCI6MjA5MjU4NzA1M30.aA9_xcw2cbzPqPU8DDgC-drwxh6VNQyAVUgmDAHnzls';

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: {
    fetch: async (url, options) => {
      const res = await fetch(url, options);
      const text = await res.text();
      console.log('Status:', res.status);
      console.log('Body:', text);
      return new Response(text, { status: res.status, headers: res.headers });
    }
  }
});

async function runTest() {
  console.log('Sending a single column payload: { "type": "discussion" }');
  await supabase.from('posts').insert({ type: 'discussion' }).select().single();
  
  console.log('\nSending a single column payload: { "title": "test" }');
  await supabase.from('posts').insert({ title: 'test' }).select().single();

  console.log('\nSending a single column payload: { "locality_id": null }');
  await supabase.from('posts').insert({ locality_id: null }).select().single();
}

runTest();
