-- Migration: Add WhatsApp tracking fields to notifications table
-- Run this in Supabase SQL Editor

-- Add phone_number column to store the recipient phone number
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add wa_message_id column to store WhatsApp message ID for tracking
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS wa_message_id VARCHAR(100);

-- Add wa_sent_at column to store when WhatsApp was sent
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS wa_sent_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_phone_number ON notifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_notifications_wa_message_id ON notifications(wa_message_id);

-- Comment
COMMENT ON COLUMN notifications.phone_number IS 'Recipient phone number in 62xxx format';
COMMENT ON COLUMN notifications.wa_message_id IS 'WhatsApp message ID from Baileys for tracking';
COMMENT ON COLUMN notifications.wa_sent_at IS 'Timestamp when WhatsApp message was sent';
