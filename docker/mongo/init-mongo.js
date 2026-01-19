// Breyus MongoDB Initialization Script
// This script runs when the MongoDB container is first created

// Switch to the breyus database
db = db.getSiblingDB('breyus');

// Create collections with validators
// Note: Using 'mail' field (not 'email') to match the Mongoose schema
// Role is optional during initial creation (set in onboarding step 5)
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['mail', 'password'],
      properties: {
        mail: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        password: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        role: {
          enum: ['buyer', 'seller', 'admin', null],
          description: 'must be one of buyer, seller, admin, or null'
        }
      }
    }
  }
});

db.createCollection('companies');
db.createCollection('products');
db.createCollection('trades');
db.createCollection('wishlists');
db.createCollection('conversations');
db.createCollection('messages');
db.createCollection('notifications');
db.createCollection('activity_logs');
db.createCollection('maintenance_configs');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ companyId: 1 });

db.companies.createIndex({ userId: 1 });
db.companies.createIndex({ isVerified: 1 });

db.products.createIndex({ sellerId: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ isActive: 1 });
db.products.createIndex({ '$**': 'text' }, { name: 'product_text_search' });

db.trades.createIndex({ buyerId: 1 });
db.trades.createIndex({ sellerId: 1 });
db.trades.createIndex({ status: 1 });
db.trades.createIndex({ phase: 1 });
db.trades.createIndex({ createdAt: -1 });

db.wishlists.createIndex({ userId: 1 });
db.wishlists.createIndex({ productId: 1 });

db.conversations.createIndex({ participants: 1 });
db.conversations.createIndex({ lastMessageAt: -1 });

db.messages.createIndex({ conversationId: 1 });
db.messages.createIndex({ createdAt: -1 });

db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ isRead: 1 });
db.notifications.createIndex({ createdAt: -1 });

db.activity_logs.createIndex({ adminId: 1 });
db.activity_logs.createIndex({ action: 1 });
db.activity_logs.createIndex({ timestamp: -1 });
db.activity_logs.createIndex({ category: 1 });

// Create the application user (optional - for more secure setup)
// db.createUser({
//   user: 'breyus_app',
//   pwd: 'app_password',
//   roles: [{ role: 'readWrite', db: 'breyus' }]
// });

print('Breyus database initialized successfully!');
print('Collections created: users, companies, products, trades, wishlists, conversations, messages, notifications, activity_logs, maintenance_configs');
print('Indexes created for optimal query performance');
