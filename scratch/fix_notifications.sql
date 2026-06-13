-- =======================================================
-- FIX MISSING SENDER_ID IN NOTIFICATIONS
-- =======================================================

-- Adds the missing sender_id column to the notifications table if it doesn't already exist.
-- This prevents the "column sender_id of relation notifications does not exist" error when commenting.

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
