const supabaseUrl = 'https://vtszkowjjwkdxxgufgie.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0c3prb3dqandrZHh4Z3VmZ2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTEwNTMsImV4cCI6MjA5MjU4NzA1M30.aA9_xcw2cbzPqPU8DDgC-drwxh6VNQyAVUgmDAHnzls';

async function checkColumns() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/posts?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!res.ok) {
      console.log('Error fetching posts:', await res.text());
      return;
    }
    
    const data = await res.json();
    if (data.length > 0) {
      console.log('ACTUAL COLUMNS IN public.posts:', Object.keys(data[0]));
    } else {
      console.log('No rows in posts table. We cannot infer columns from an empty array via REST.');
      
      // Attempt to insert a dummy row and catch the error to see if title exists
      console.log('Attempting to insert dummy row with title...');
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: 'Dummy Title',
          type: 'discussion'
        })
      });
      console.log('Insert response status:', insertRes.status);
      console.log('Insert response body:', await insertRes.text());
    }
  } catch (e) {
    console.error(e);
  }
}

checkColumns();
