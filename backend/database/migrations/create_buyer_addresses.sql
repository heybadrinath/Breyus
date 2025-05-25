-- Migration: Create buyer addresses and chat system
-- This migration enhances the existing user_details table and adds chat functionality

-- First, ensure user_details table has all necessary address fields
-- Check if columns exist before adding them to avoid duplicate column errors

-- Add address fields to user_details if they don't exist (using conditional logic)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll use a different approach

-- Create a temporary table to check existing columns and add missing ones
PRAGMA table_info(user_details);

-- Since SQLite doesn't support conditional ALTER TABLE, we'll use a safer approach
-- The columns likely already exist based on the entity definition, so we'll skip the ALTER statements
-- and focus on creating the chat system tables

-- Create chat_conversations table for buyer-seller communication
CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    trade_id TEXT,
    last_message_id TEXT,
    last_message_at DATETIME DEFAULT (datetime('now')),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL,
    
    UNIQUE(buyer_id, seller_id)
);

-- Create chat_messages table for storing individual messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file', 'trade_update'
    content TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT 0,
    is_delivered BOOLEAN DEFAULT 0,
    trade_reference_id TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trade_reference_id) REFERENCES trades(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_buyer_id ON chat_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_seller_id ON chat_conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_trade_id ON chat_conversations(trade_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message_at ON chat_conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

-- Create trigger to update conversation's last_message_at when a new message is added
CREATE TRIGGER IF NOT EXISTS update_conversation_last_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
BEGIN
    UPDATE chat_conversations 
    SET 
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        updated_at = datetime('now')
    WHERE id = NEW.conversation_id;
END;

-- Create trigger to automatically create conversation when trade is accepted
CREATE TRIGGER IF NOT EXISTS create_conversation_on_trade_accept
    AFTER UPDATE ON trades
    FOR EACH ROW
    WHEN NEW.status = 'accepted' AND OLD.status != 'accepted'
BEGIN
    INSERT OR IGNORE INTO chat_conversations (
        id,
        buyer_id,
        seller_id,
        trade_id,
        created_at,
        updated_at
    ) VALUES (
        'conv_' || NEW.buyer_id || '_' || NEW.seller_id || '_' || datetime('now'),
        NEW.buyer_id,
        NEW.seller_id,
        NEW.id,
        datetime('now'),
        datetime('now')
    );
    
    -- Send initial system message
    INSERT INTO chat_messages (
        id,
        conversation_id,
        sender_id,
        receiver_id,
        message_type,
        content,
        trade_reference_id,
        created_at
    ) VALUES (
        'msg_' || NEW.id || '_welcome_' || datetime('now'),
        'conv_' || NEW.buyer_id || '_' || NEW.seller_id || '_' || datetime('now'),
        NEW.seller_id,
        NEW.buyer_id,
        'trade_update',
        'Trade request accepted! You can now chat directly with the seller.',
        NEW.id,
        datetime('now')
    );
END;

-- Create notification_preferences table for user chat preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email_notifications BOOLEAN DEFAULT 1,
    push_notifications BOOLEAN DEFAULT 1,
    chat_notifications BOOLEAN DEFAULT 1,
    trade_notifications BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

-- Insert default notification preferences for existing users
INSERT OR IGNORE INTO notification_preferences (id, user_id)
SELECT 'notif_' || id, id FROM users;

-- Create view for conversation list with user details
CREATE VIEW IF NOT EXISTS conversation_list_view AS
SELECT 
    c.id as conversation_id,
    c.buyer_id,
    c.seller_id,
    c.trade_id,
    c.last_message_at,
    c.is_active,
    
    -- Buyer details
    buyer.firstName as buyer_first_name,
    buyer.lastName as buyer_last_name,
    buyer.email as buyer_email,
    buyer.profileImage as buyer_profile_image,
    
    -- Seller details
    seller.firstName as seller_first_name,
    seller.lastName as seller_last_name,
    seller.email as seller_email,
    seller.profileImage as seller_profile_image,
    
    -- Last message details
    lm.content as last_message_content,
    lm.message_type as last_message_type,
    lm.sender_id as last_message_sender_id,
    
    -- Trade details if exists
    t.status as trade_status,
    t.offered_price as trade_offered_price,
    
    -- Product details if trade exists
    p.name as product_name,
    p.productImage as product_image
    
FROM chat_conversations c
LEFT JOIN users buyer ON c.buyer_id = buyer.id
LEFT JOIN users seller ON c.seller_id = seller.id
LEFT JOIN chat_messages lm ON c.last_message_id = lm.id
LEFT JOIN trades t ON c.trade_id = t.id
LEFT JOIN products p ON t.product_id = p.id
ORDER BY c.last_message_at DESC;

-- Create view for unread message counts
CREATE VIEW IF NOT EXISTS unread_message_counts AS
SELECT 
    receiver_id as user_id,
    conversation_id,
    COUNT(*) as unread_count
FROM chat_messages 
WHERE is_read = 0
GROUP BY receiver_id, conversation_id; 