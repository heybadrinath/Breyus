# Real-Time Trade Management System

A comprehensive trade management system for commodity trading with real-time WebSocket notifications, built with NestJS backend and React frontend.

## 🚀 Features

### Backend Features
- **JWT Authentication** with role-based access control
- **Real-time WebSocket** notifications for trade updates
- **Automatic trade expiration** (24-hour default with cron jobs)
- **Bulk operations** for accepting multiple trades
- **Counter-offer system** with negotiation tracking
- **Inventory validation** before trade acceptance
- **Comprehensive filtering** and pagination
- **Transaction management** for data consistency
- **Rate limiting** to prevent spam requests

### Frontend Features
- **Real-time dashboard** with live trade updates
- **Interactive trade management** with Accept/Reject/Counter-offer
- **Bulk selection** and operations
- **Advanced filtering** and search
- **Trade detail modals** with complete information
- **Toast notifications** for real-time events
- **Status badges** with urgency indicators
- **Responsive design** for all devices

## 📋 API Endpoints

### Trade Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/trades/incoming` | Get incoming trade requests for seller | ✅ |
| GET | `/trades/my-requests` | Get trade requests created by buyer | ✅ |
| GET | `/trades/:id/details` | Get detailed trade information | ✅ |
| GET | `/trades/stats` | Get trade statistics for dashboard | ✅ |
| POST | `/trades` | Create new trade request (buyer) | ✅ |
| POST | `/trades/:id/accept` | Accept a trade request | ✅ |
| POST | `/trades/:id/reject` | Reject a trade request | ✅ |
| POST | `/trades/bulk-accept` | Accept multiple trades at once | ✅ |
| PATCH | `/trades/:id/counter-offer` | Make a counter offer | ✅ |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Client → Server | Authenticate and connect |
| `subscribe-to-trades` | Client → Server | Subscribe to trade updates |
| `new-trade-request` | Server → Client | New trade request received |
| `trade-status-update` | Server → Client | Trade status changed |
| `counter-offer` | Server → Client | Counter offer made |
| `trade-expired` | Server → Client | Trade request expired |
| `urgent-trade` | Server → Client | Urgent trade notification |

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+
- NPM or Yarn
- SQLite (included)

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Environment variables:**
Create `.env` file in backend directory:
```env
NODE_ENV=development
JWT_SECRET=your-secret-key-here
DB_PATH=breyus.sqlite
FRONTEND_URL=http://localhost:3000
```

3. **Database setup:**
```bash
# The trades table will be automatically created via TypeORM synchronization
# Or you can run manual migrations if needed
```

4. **Start the backend:**
```bash
npm run start:dev
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Environment variables:**
Create `.env` file in frontend directory:
```env
REACT_APP_API_URL=http://localhost:3001
```

3. **Start the frontend:**
```bash
npm start
```

## 🧪 Testing the System

### 1. Database Setup with Test Data

First, you'll need to update the seed data with actual user and product IDs:

```sql
-- Find actual user IDs
SELECT id, email, role FROM users LIMIT 10;

-- Find actual product IDs for your seller
SELECT id, name, price FROM products WHERE sellerId = 'your-seller-id-here';
```

Update the `backend/database/migrations/seed_trade_data.sql` file with real IDs, then run:

```bash
# Connect to your SQLite database and run the seed script
sqlite3 breyus.sqlite < backend/database/migrations/seed_trade_data.sql
```

### 2. Authentication

1. **Login as a seller** through the frontend
2. **Get your seller ID** by calling:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/analytics/debug/user
   ```

### 3. Testing Trade Operations

#### Create a Trade Request (as buyer):
```bash
curl -X POST http://localhost:3001/trades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BUYER_JWT_TOKEN" \
  -d '{
    "seller_id": "seller-uuid",
    "product_id": "product-uuid", 
    "offered_price": 99.99,
    "quantity": 2,
    "buyer_message": "Interested in this product!",
    "is_urgent": false
  }'
```

#### Get Incoming Trades (as seller):
```bash
curl -H "Authorization: Bearer SELLER_JWT_TOKEN" \
  "http://localhost:3001/trades/incoming?status=pending&limit=10"
```

#### Accept a Trade:
```bash
curl -X POST http://localhost:3001/trades/TRADE_ID/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SELLER_JWT_TOKEN" \
  -d '{"message": "Accepted! Will process immediately."}'
```

#### Make Counter Offer:
```bash
curl -X PATCH http://localhost:3001/trades/TRADE_ID/counter-offer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SELLER_JWT_TOKEN" \
  -d '{
    "counter_offer_price": 120.00,
    "seller_message": "Best I can do is $120"
  }'
```

### 4. WebSocket Testing

Open browser developer tools and test WebSocket connection:

```javascript
// Connect to trade WebSocket
const socket = io('http://localhost:3001/trades', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Subscribe to trade updates
socket.emit('subscribe-to-trades');

// Listen for events
socket.on('new-trade-request', (data) => {
  console.log('New trade request:', data);
});

socket.on('trade-status-update', (data) => {
  console.log('Trade status updated:', data);
});
```

## 🎯 Frontend Usage

### Seller Dashboard

1. **Navigate to Trade Management:**
   - Go to `/seller/trade` in your application
   - You'll see tabs for different trade categories

2. **Purchase Request Status Tab:**
   - View all incoming trade requests
   - Real-time updates with WebSocket notifications
   - Accept/Reject/View details for each trade
   - Bulk operations for multiple trades
   - Search and filter functionality

3. **Trade Actions:**
   - **Accept:** Immediately accept a trade request
   - **Reject:** Decline with optional reason
   - **View Details:** See complete trade information
   - **Counter Offer:** Negotiate price and terms
   - **Bulk Accept:** Select multiple trades and accept all

4. **Real-time Features:**
   - Toast notifications for new trades
   - Live status updates
   - Urgency indicators
   - Auto-refresh on changes

## 🔧 Configuration Options

### Trade Expiration
```typescript
// In trades.service.ts - change expiration time
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours default
```

### Auto-expire Cron Job
```typescript
// In trades.service.ts - modify cron schedule
@Cron(CronExpression.EVERY_HOUR) // Run every hour
async autoExpireTrades() {
  // Expire logic
}
```

### WebSocket CORS
```typescript
// In trades.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: '/trades'
})
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed:**
   - Check if JWT token is valid
   - Verify CORS settings
   - Ensure backend is running on correct port

2. **No Trades Appearing:**
   - Verify user authentication
   - Check if trades exist for your seller ID
   - Confirm database connection

3. **Real-time Updates Not Working:**
   - Check WebSocket connection in browser dev tools
   - Verify event listeners are properly set
   - Ensure JWT token hasn't expired

### Debug Commands

```bash
# Check trade data in database
sqlite3 breyus.sqlite "SELECT * FROM trades WHERE seller_id = 'your-seller-id';"

# Check WebSocket connections (in browser console)
console.log(tradeService.socket?.connected);

# View trade service events
tradeService.addEventListener('debug', console.log);
```

## 🚀 Production Deployment

### Environment Variables
```env
# Backend
NODE_ENV=production
JWT_SECRET=your-production-secret
DB_PATH=/path/to/production/database.sqlite
FRONTEND_URL=https://your-domain.com

# Frontend  
REACT_APP_API_URL=https://api.your-domain.com
```

### Performance Considerations

1. **Database Indexing:** Already included in entity definitions
2. **WebSocket Scaling:** Consider Redis adapter for multiple server instances
3. **Rate Limiting:** Implemented for trade actions
4. **Caching:** Consider Redis for frequently accessed data

### Security Checklist

- [x] JWT authentication required for all endpoints
- [x] CSRF protection for state-changing operations
- [x] Input validation with class-validator
- [x] Authorization checks (seller can only modify own trades)
- [x] Rate limiting on trade actions
- [x] WebSocket authentication

## 📊 Monitoring & Analytics

The system includes built-in analytics endpoints:

```bash
# Get trade statistics
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/trades/stats
```

Returns:
```json
{
  "total_incoming": 15,
  "pending": 3,
  "accepted": 8,
  "rejected": 2,
  "expired": 1,
  "today_incoming": 2
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📝 License

This trade management system is part of the Breyus platform. See LICENSE file for details.

---

## Quick Start Checklist

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed  
- [ ] Environment variables configured
- [ ] Database created and seeded
- [ ] JWT authentication working
- [ ] WebSocket connection established
- [ ] Test trade creation and acceptance
- [ ] Real-time notifications working

**Ready to start trading! 🎉** 