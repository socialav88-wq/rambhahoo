const { createClient } = require('@supabase/supabase-js');

const NEXT_PUBLIC_SUPABASE_URL = 'https://vtszkowjjwkdxxgufgie.supabase.co';
const NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0c3prb3dqandrZHh4Z3VmZ2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTEwNTMsImV4cCI6MjA5MjU4NzA1M30.aA9_xcw2cbzPqPU8DDgC-drwxh6VNQyAVUgmDAHnzls';

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testRLS() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('1. Creating test user...');
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpErr) {
    console.error('Signup failed:', signUpErr.message);
    return;
  }

  const user = signUpData.user;
  console.log('User created:', user.id);

  console.log('2. Attempting to insert post...');
  const postPayload = {
    user_id: user.id,
    title: 'Test RLS Post',
    content: 'RLS check',
    post_type: 'discussion', // using the new correct column name
    image_url: null,
    locality_id: null,
    tags: []
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(postPayload)
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert success!', data.id);
  }

  // Cleanup if we want, but tests are fine
}

testRLS();
