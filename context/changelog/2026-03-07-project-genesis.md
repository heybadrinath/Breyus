---
type: changelog
date: "2026-03-07"
change_type: feature-inventory
scope: all
tags: [changelog, genesis, inventory]
---

# Breyus Genesis Feature Inventory

B2B commodity trading platform with AI-powered deal matching, full trade lifecycle management (PR through BoL), and a dedicated admin portal. Codebase spans 42 backend controllers, 33 database schemas, 39 frontend pages, 15 admin feature modules, and 10 AI services.

## Backend Features (42 controllers, 3 WebSocket gateways)

- **Auth**: Login with OTP (Redis-backed), JWT cookie sessions, password reset/change, forgot-password
- **Users**: CRUD, suspension/unsuspension, role management
- **Company**: Profiles, KYC document upload, public profiles, GST verification
- **Products**: 5-step creation wizard, inventory management, HSN codes, file uploads
- **Trade**: Full lifecycle (PR/SCO/ICPO/SPA/Payment/BoL), counter-offers, document uploads, phase advancement, cancellation, audit logging
- **Inbox**: Conversations, messages, WebSocket gateway for real-time chat
- **Wishlist**: Add/remove/list wishlist items
- **Onboarding**: Multi-step registration wizard
- **Mail**: Sendinblue + SMTP email dispatch, Redis-backed queue
- **Notifications**: CRUD, real-time delivery
- **Analytics**: Metrics, bar/scatter/pie data, country sales, export
- **Feedback**: User feedback collection
- **Commodities**: Commodity database and search
- **AI Integration**: Search, commodity classification, market analysis jobs, gravity scoring, seller inventory matching
- **Blog**: Post CRUD, newsletter subscribers, newsletter cron
- **Blog Portal** (6 controllers): Auth, posts, comments, writers, invites, writer dashboard
- **Docs**: API documentation endpoint

## Admin Backend (14 controllers)

- Auth (separate sessions), Dashboard (live stats), Users, Companies, KYC review queue
- Trades (timeline, notes, document verification, force-phase), Disputes (assign, resolve, messages)
- Content (categories, countries, currencies, HSN codes, incoterms, ports, units)
- Products, Analytics (with export), Activity logging, Alerts, Security (IP blocking, failed logins), System health/maintenance
- WebSocket gateway for admin real-time updates

## Database Models (33 schemas)

- **Core**: User, Company, Product, HSN, Trade, AuditLog, Wishlist, Feedback
- **Messaging**: Conversation, Message, Notification
- **Admin**: AdminUser, AdminSession, AdminActivityLog, MaintenanceConfig
- **Content**: Country, Currency, Incoterm, Port, ProductCategory, Unit
- **Security**: AlertRule, AlertHistory, BlockedIP, FailedLoginAttempt, TradeDispute
- **Blog**: BlogPost, NewsletterSubscriber, BlogUser, BlogSession, BlogComment, BlogLike, BlogWriterInvite

## Frontend Features

- **Public pages** (7): Hero, Login, Onboarding, SelectRole, ForgotPassword, ScheduleMeeting, MaintenancePage
- **Buyer pages** (18): Homepage, Product, PurchaseRequest, Trade (5-tab), Negotiation, Inbox, Wishlist, Settings, Marketplace, SellerProfile, AI (landing, select, niche, result), Notifications
- **Seller pages** (21): Dashboard, Sales, Inventory, AddProduct, Trade, Negotiation, Inbox, Wishlist, Settings, Marketplace, BuyerProfile, Feedback, Upgrade, Security, AI (landing, inventory, select, result), Search (option, input, result)
- **Blog portal** (14 pages): Home, Login, Signup, ForgotPassword, PostDetail, Category, Search, Writers, Trending, WriterProfile, Settings, WriterDashboard, WriterEditor, WriterInvite
- **Shared components** (82): Sidebar, TradeTabs, TradeDetailsModal, NegotiationHistory, DocumentUpload/Sign/View/Replace/Status modals, AuditHistory, TrackTrade, InboxSidebar/Conversation, CategorySelector, PortSelector, CountrySelector, Incoterms, AI components (ResultCard, LoadingOverlay, EmptyState, ErrorState, ResultFilters, ExpandableText/List), Marketplace (BlogCard, CommodityPriceWidget, MarketNews), Notification system, Settings tabs
- **Services** (18): auth, login, ai, trade, products, company, inbox, wishlist, onboarding, analytics, notification, content, feedback, commodity, blog, users, maintenance, socket
- **Hooks**: useAISearch, useAnalysisPolling
- **Routes**: 50+ defined routes with role-based protection (BuyerProtectedRoute, SellerProtectedRoute)

## Admin Portal (15 feature modules)

activity, alerts, analytics, auth, blog, companies, content, dashboard, disputes, kyc, products, security, system, trades, users

## AI Server (10 services, FastAPI + PostgreSQL/pgvector)

- **commodity_search**: Semantic search with mainstream/niche detection via embeddings
- **commodity_classifier**: Mainstream vs niche classification
- **link_predictor**: 5-strategy waterfall partner matching (historical, similarity, geospatial, pre-computed, commodity pool)
- **market_analyzer**: Async demand forecasting, price trends, risk assessment
- **trade_scorer**: Gravity score (demand, port proximity, frequency, volatility, weather, barriers)
- **embedding_service**: sentence-transformers vector embeddings
- **entity_resolver**: Company information resolution
- **cache_service / postgres_cache**: Redis + PostgreSQL caching layers
- **job_queue**: Async job management for analysis tasks

## Seeds & Migrations (16 scripts)

hsn-seed, migrate-cis-documents, migrate-schema-fixes, migrate-blog-clean-slate, migrate-document-rejection-tracking, migrate-negotiation-counter-tracking, reset-trade-to-spa, seed-admin-dashboard-data, seed-ai-sellers, seed-ai-sellers-standalone, seed-alerts-data, seed-analytics-test-data, seed-blog-analytics-data, seed-blog-posts, seed-commodities-enhanced, update-stalled-trades

## Key Architectural Patterns

- **Auth**: Two-factor (password + email OTP), JWT in signed HTTP-only cookies, separate admin auth
- **Real-time**: 3 WebSocket gateways (inbox, trade, admin)
- **AI**: Microservice gateway pattern -- NestJS proxies to FastAPI, enriches with MongoDB data
- **Storage**: Pluggable provider (local + S3), Multer for uploads
- **Blog**: Fully independent portal with own auth (BlogUser), writer invite system, Tiptap editor
- **Deployment**: Docker Compose with Nginx reverse proxy, multi-stage Dockerfiles
