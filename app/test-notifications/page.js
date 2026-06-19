'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { toggleFollow } from '@/app/actions/profile';
import { toggleReaction, addComment, votePoll, reportPost } from '@/app/actions/interactions';
import { createPost } from '@/app/actions/posts';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function TestNotificationsPage() {
  const { user } = useAuthStore();
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [targetUser, setTargetUser] = useState(null);
  const [testPost, setTestPost] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    // Find another user to test interactions with
    const setup = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(1);

      if (data && data.length > 0) {
        setTargetUser(data[0]);
      } else {
        toast.error('No other users found in database to test interactions with. Please create another user first.');
      }
    };
    setup();
  }, [user]);

  const addLog = (message, status = 'info') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), message, status }]);
  };

  const runAllTests = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }
    if (!targetUser) {
      toast.error('No target user found for interactions');
      return;
    }

    setRunning(true);
    setLogs([]);
    addLog('Starting Server Action & Notification tests...', 'info');

    const supabase = createClient();

    try {
      // 1. Test Self-Follow Prevention via Server Action
      addLog(`[Test 1] Testing self-follow prevention server-side...`, 'info');
      const followSelfRes = await toggleFollow(user.id);
      if (followSelfRes?.error === 'Cannot add yourself to your own Circle') {
        addLog(`✅ Server Action successfully blocked self-follow with message: "${followSelfRes.error}"`, 'success');
      } else {
        addLog(`❌ Failed! Expected self-follow rejection, got: ${JSON.stringify(followSelfRes)}`, 'error');
      }

      // 2. Test Circle Add (Follow Target User)
      addLog(`[Test 2] Adding Target User (${targetUser.username}) to Circle...`, 'info');
      const followRes = await toggleFollow(targetUser.id);
      if (followRes?.success) {
        addLog(`✅ Follow toggled successfully! Action: ${followRes.action}`, 'success');
        
        // Wait and check notification in DB
        await new Promise(r => setTimeout(r, 1000));
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', targetUser.id)
          .eq('actor_id', user.id)
          .eq('type', 'CIRCLE_ADD')
          .order('created_at', { ascending: false })
          .limit(1);

        if (notifs && notifs.length > 0) {
          addLog(`✅ Database verified: CIRCLE_ADD notification created successfully!`, 'success');
        } else {
          addLog(`❌ Database verification failed: CIRCLE_ADD notification not found.`, 'error');
        }
      } else {
        addLog(`❌ Follow failed: ${followRes?.error}`, 'error');
      }

      // 3. Create a test post for comments & reactions
      addLog(`[Test 3] Creating a test post...`, 'info');
      const formData = new FormData();
      formData.append('title', `E2E Notification Test Post ${Date.now()}`);
      formData.append('content', `Mentions check for @${targetUser.username}`);
      formData.append('post_type', 'discussion');
      
      const postRes = await createPost(formData);
      if (postRes?.success && postRes.slug) {
        addLog(`✅ Post created successfully! Slug: ${postRes.slug}`, 'success');
        
        // Retrieve the post id
        const { data: postData } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', postRes.slug)
          .single();
        
        setTestPost(postData);

        // Verify MENTION notification was created
        await new Promise(r => setTimeout(r, 1000));
        const { data: mentionNotifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', targetUser.id)
          .eq('actor_id', user.id)
          .eq('type', 'MENTION')
          .order('created_at', { ascending: false })
          .limit(1);

        if (mentionNotifs && mentionNotifs.length > 0) {
          addLog(`✅ Database verified: MENTION notification created for @${targetUser.username}!`, 'success');
        } else {
          addLog(`❌ Database verification failed: MENTION notification not found.`, 'error');
        }

        // 4. Test Reaction
        addLog(`[Test 4] Reacting to own post... (should skip self-notification)`, 'info');
        const reactSelfRes = await toggleReaction(postData.id, null, '👍');
        if (reactSelfRes?.success) {
          addLog(`✅ Reacted to post successfully! Action: ${reactSelfRes.action}`, 'success');
          
          await new Promise(r => setTimeout(r, 1000));
          const { data: reactNotifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('actor_id', user.id)
            .eq('type', 'POST_LIKE');

          if (!reactNotifs || reactNotifs.length === 0) {
            addLog(`✅ Database verified: Self-notification correctly skipped.`, 'success');
          } else {
            addLog(`❌ Failed: Self-notification was incorrectly created!`, 'error');
          }
        } else {
          addLog(`❌ Reaction failed: ${reactSelfRes?.error}`, 'error');
        }

      } else {
        addLog(`❌ Post creation failed: ${postRes?.error}`, 'error');
      }

      // 5. Test Reports Notification (Simulate reporting post)
      if (testPost || postRes?.slug) {
        const pId = testPost?.id || (await supabase.from('posts').select('id').eq('slug', postRes.slug).single()).data.id;
        
        addLog(`[Test 5] Simulating report on post...`, 'info');
        
        // Temporarily set current user as admin to receive reports
        addLog(`Updating own profile to is_admin = true to receive report notifications...`, 'info');
        await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id);

        const reportRes = await reportPost(pId, 'Testing admin report notifications');
        if (reportRes?.success) {
          addLog(`✅ Post reported successfully!`, 'success');
          
          // Check for POST_REPORT notification directed to current user (since they are admin now)
          await new Promise(r => setTimeout(r, 1500));
          const { data: reportNotifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('actor_id', user.id)
            .eq('type', 'POST_REPORT')
            .order('created_at', { ascending: false })
            .limit(1);

          if (reportNotifs && reportNotifs.length > 0) {
            addLog(`✅ Database verified: POST_REPORT notification created successfully for admins! Content: "${reportNotifs[0].content}"`, 'success');
          } else {
            addLog(`❌ Database verification failed: POST_REPORT notification not found. Make sure user table has is_admin enabled!`, 'error');
          }
        } else {
          addLog(`❌ Report failed: ${reportRes?.error}`, 'error');
        }

        // Revert admin status
        addLog(`Reverting profile admin status...`, 'info');
        await supabase.from('profiles').update({ is_admin: false }).eq('id', user.id);
      }

    } catch (e) {
      addLog(`❌ Unhandled test exception: ${e.message}`, 'error');
    } finally {
      setRunning(false);
      addLog('All tests completed!', 'info');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-0">
      <div className="bg-bg-card rounded-3xl p-6 border border-border shadow-sm">
        <h1 className="text-2xl font-black text-text-primary mb-2">Notification System E2E Tests</h1>
        <p className="text-sm text-text-muted mb-6">
          This utility executes Rambhahoo Server Actions and verifies that they create the correct notifications, triggers, and DB check constraints.
        </p>

        {!user ? (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl text-accent-red font-medium text-sm mb-4">
            You must be logged in to run these tests. Please navigate to login page, authenticate, and return here.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <Button 
                onClick={runAllTests} 
                disabled={running || !targetUser}
                variant="primary"
                className="rounded-full px-6 font-bold"
              >
                {running ? 'Running Tests...' : 'Run Action & Trigger Tests'}
              </Button>
              {targetUser ? (
                <div className="text-xs text-text-dim">
                  Target User for interaction: <span className="font-semibold text-text-primary">@{targetUser.username}</span>
                </div>
              ) : (
                <div className="text-xs text-accent-red font-medium">
                  Loading target user...
                </div>
              )}
            </div>

            <div className="bg-bg-elevated rounded-2xl p-4 font-mono text-xs max-h-96 overflow-y-auto border border-border space-y-1.5 no-scrollbar">
              {logs.length === 0 ? (
                <div className="text-text-dim text-center py-4">Logs will show here...</div>
              ) : (
                logs.map(log => (
                  <div 
                    key={log.id} 
                    className={
                      log.status === 'success' ? 'text-accent-green font-semibold' :
                      log.status === 'error' ? 'text-accent-red font-semibold' : 
                      'text-text-primary'
                    }
                  >
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
