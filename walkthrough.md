# Walkthrough — Rambhahoo "Need Advice" Hyperlocal Support System

We have completed the full implementation of the **Need Advice** feature. It is designed as a dedicated community-driven support sub-system rather than a basic discussion board. It includes structured advice categories, support-focused reaction sets, dynamic polls, user answer quality rating badges, pinned best advice cards, anonymous posting toggles, locality neighborhood filters, and a time-decayed trending algorithm.

---

## 1. Database Schema & Policies Setup

We designed a fully isolated database sub-system with 8 tables, indexes, check constraints, realtime replication, and custom security definer triggers to protect data integrity and calculate counts instantly.

### SQL Migration Script: [need_advice_migration.sql](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/supabase/need_advice_migration.sql)
- **Tables Initialized**:
  - `advice_posts`: Handles category tags, title, contextual description, images, poll triggers, anonymous status, and search tsvectors.
  - `advice_poll_options` & `advice_poll_votes`: Tracks question choices and unique vote limits per user.
  - `advice_replies`: Stores community responses and marked statuses.
  - `advice_reply_ratings`: Holds rated feedback (helpful, very_helpful, best_advice) per reply.
  - `advice_post_reactions`: Manages support-focused reactions (`🙏`, `☕`, `❤️`, `👏`, `🌟`).
  - `advice_followers`: Tracks users following a specific question.
  - `advice_updates`: Enables authors to post follow-up logs on their threads.
- **Triggers (`SECURITY DEFINER`)**:
  - `update_advice_replies_count`: Dynamically updates `replies_count` on `advice_posts`.
  - `update_advice_followers_count`: Dynamically updates `followers_count` on `advice_posts`.
  - `update_advice_post_reaction_counts`: Parses emoji changes and increments/decrements count values in a single JSONB column `reaction_counts` on `advice_posts` for optimal performance.
  - `update_advice_reply_ratings_counters`: Increments/decrements quality counts (`helpful_count`, `very_helpful_count`, `best_advice_count`) on `advice_replies` on user feedback toggle.
  - `update_advice_poll_vote_counts`: Increments choice counts on vote.
- **RLS Policies**: RLS is fully enabled across all 8 tables. Select permissions are public, while insert/update/delete writes are locked down to authenticated owners.
- **Replication**: Added all 8 tables to the `supabase_realtime` publication for instant WebSocket feed updates.
- **Decay Algorithm (`get_trending_advice_posts_decayed`)**: A custom Postgres RPC that ranks questions by reaction counts, reply counts, followers, quality scores, best answers pinned, and divides by a time-decay exponent (hours elapsed since creation) to prevent stale posts from dominating the trending feed.

---

## 2. Server Actions

### File Created: [advice.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/app/actions/advice.js)
- Implements Next.js server actions:
  - `createAdvicePost(formData)`: Manages title, context, categories, optional images upload to Supabase storage, and poll option creations.
  - `fetchAdviceFeed(filter, category, locality, page, limit)`: Serves paginated posts. Supports `trending` RPC decay feed, `my_questions` follows/own queries, and category filtering.
  - `fetchAdvicePostBySlug(slug)`: Retrieves details for details page. Handles anonymous mode securely by masking profile data to `'Anonymous User ☕'` unless viewed by the author or an admin.
  - `addAdviceReply(postId, content)`: Inserts a reply. Triggers push alerts to post owner (`ADVICE_REPLY`) and thread followers (`ADVICE_FOLLOWER_NEW_REPLY`).
  - `voteAdvicePoll(postId, optionId)`: Unique vote check and registration.
  - `toggleAdviceReaction(postId, emoji)`: Toggles support reaction icons.
  - `rateAdviceReply(replyId, rating)`: Saves quality ratings and alerts authors (`ADVICE_REPLY_HELPFUL`).
  - `markBestAdvice(postId, replyId)`: Enables thread author to pin a reply. Sends alerts to the answerer (`ADVICE_BEST_SELECTION`) and thread followers (`ADVICE_FOLLOWER_BEST`).
  - `toggleFollowAdvice(postId)`: Social follows on questions.
  - `addAdviceUpdate(postId, content)`: Posts author updates. Dispatches push alerts to followers (`ADVICE_FOLLOWER_UPDATE`).

---

## 3. Frontend Pages & Routes

### File Created: [app/advice/page.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/app/advice/page.js)
- Main Advice board dashboard. Serves server-side data on load and sets SEO tags.
- Links to [AdviceFeedContainer.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/components/advice/AdviceFeedContainer.js) client side page.

### File Created: [app/advice/create/page.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/app/advice/create/page.js)
- Routing page that redirects unauthenticated users to `/login` and renders the custom creation form component.

### File Created: [app/advice/post/[slug]/page.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/app/advice/post/[slug]/page.js)
- Detailed question view route. Serves advice questions, choice polls, author logs, and community answer lists.

---

## 4. UI Components

- **Advice Feed Card** ([AdviceFeedCard.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/components/advice/AdviceFeedCard.js)): Premium glassmorphic card representing the question, category tag, location info, user details (or anonymous representation), and reaction stats.
- **Advice Feed Orchestrator** ([AdviceFeedContainer.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/components/advice/AdviceFeedContainer.js)): Handles dynamic category sidebars, horizontal categories swipe bars on mobile viewports, filter tabs (Latest, Trending, My Advice), locality filters, ask-button links, and infinite scroll pagination.
- **Create Form** ([CreateAdviceForm.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/components/advice/CreateAdviceForm.js)): Responsive input form containing titles, context textareas, additional details, media file selection, poll builder options, anonymous eye-off toggles, and locality selectors.
- **Advice Poll Voter** ([AdvicePollVoter.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/components/advice/AdvicePollVoter.js)): Renders choice items. Handles vote events and shows dynamic percentage result progress bars once voted.
- **Guidance Replies list** ([AdviceReplySection.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/components/advice/AdviceReplySection.js)):
  - Pins chosen answer to the top inside a premium amber gradient container with a `🏆 Community Selected Advice` ribbon badge.
  - Lists replies with quality ranking badges (Helpful, Very Helpful, Best Advice).
  - Displays "Pin as Best Advice" toggle button exclusively for the post author.
  - Displays reply input textarea form at the bottom.
- **Detail Layout** ([AdviceDetailContainer.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/components/advice/AdviceDetailContainer.js)): Central detail shell layout. Integrates poll voting, follow bells, author timeline updates, and support reaction emoji buttons.

---

## 5. Navigation & Layout Integration

- **Left Sidebar Navigation** ([LeftSidebar.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/components/layout/LeftSidebar.js)): Imported the `HelpCircle` icon from `lucide-react` and added a new "Need Advice" navigation link pointing to `/advice`.
- **Notification Push alerts** ([pushActions.js](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/app/actions/pushActions.js)): Added type mappings to support formatting and redirecting advice notifications (`ADVICE_REPLY`, `ADVICE_REPLY_HELPFUL`, `ADVICE_BEST_SELECTION`, etc.) to `/advice/post/[slug]`.

---

## ACTION REQUIRED: Run SQL Schema in Supabase Dashboard

To synchronize your Supabase database and enable RLS, triggers, and trending decay feeds:
1. Open your **Supabase Dashboard**.
2. Click **SQL Editor** on the left sidebar.
3. Click **New Query**.
4. Open the [need_advice_migration.sql](file:///C:/Users/ABHI%20TEJA/OneDrive/Pictures/Documents/rambhahoo/supabase/need_advice_migration.sql) file.
5. Copy all SQL code, paste it into the query editor, and click **Run**.

---

## Verification Results

### Production Compilation
We ran `npm run build` to verify clean compiling. The Next.js production build completed successfully with zero compiling or routing errors:
```bash
▲ Next.js 16.2.6 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 13.1s
  Running TypeScript ...
  Finished TypeScript in 359ms ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/26) ...
✓ Generating static pages using 7 workers (26/26) in 2.5s
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ƒ /advice
├ ƒ /advice/create
├ ƒ /advice/post/[slug]
...
```
