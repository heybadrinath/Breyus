---
type: operations-doc
module: operations
tags: [operations, load-testing, performance, k6]
date: 2026-03-11
---

# Load Testing Runbook

> **Last Updated**: March 2026
> **Criticality**: HIGH (Validate Capacity Before Production)

---

## 1. Tool: k6

[k6](https://k6.io) is an open-source load testing tool. It runs locally, produces clear CLI output, and scripts are written in JavaScript.

### Installation

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
winget install k6

# Docker (no install needed)
docker run --rm -i grafana/k6 run - < script.js
```

---

## 2. Test Scenarios

All scripts live in `scripts/load-tests/`. Create this directory before running.

### Scenario 1: Authentication Flow

Tests the most common user journey: login + OTP validation + cookie-based access.

```javascript
// scripts/load-tests/auth-flow.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Test users (create via seed script before running)
const TEST_USERS = JSON.parse(open('./test-users.json'));

export const options = {
  scenarios: {
    auth_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },   // Ramp up
        { duration: '2m', target: 50 },    // Steady state
        { duration: '30s', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],     // < 5% error rate
  },
};

export default function () {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

  // Step 1: Login (send OTP)
  const loginRes = http.post(`${BASE_URL}/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, {
    'login returns 200/201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);

  // Step 2: Validate OTP (use test OTP if configured)
  const otpRes = http.post(`${BASE_URL}/login/validate-otp`, JSON.stringify({
    email: user.email,
    otp: user.testOtp || '123456',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(otpRes, {
    'OTP validation returns 200': (r) => r.status === 200,
    'receives cookie': (r) => r.cookies['account'] !== undefined,
  });

  // Step 3: Validate cookie
  if (otpRes.status === 200) {
    const jar = http.cookieJar();
    const validateRes = http.get(`${BASE_URL}/auth/validate-cookie`);
    check(validateRes, {
      'cookie validation returns 200': (r) => r.status === 200,
    });
  }

  sleep(2);
}
```

### Scenario 2: Product Browsing

Simulates buyers browsing the marketplace.

```javascript
// scripts/load-tests/product-browse.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  scenarios: {
    browse: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // Product pages should be fast
    http_req_failed: ['rate<0.01'],     // < 1% error rate
  },
};

export default function () {
  // Step 1: Get product list
  const listRes = http.get(`${BASE_URL}/products?page=1&limit=20`);
  check(listRes, {
    'product list 200': (r) => r.status === 200,
    'returns products': (r) => JSON.parse(r.body).data.length > 0,
  });

  sleep(1);

  // Step 2: Get single product detail
  const products = JSON.parse(listRes.body).data;
  if (products.length > 0) {
    const productId = products[Math.floor(Math.random() * products.length)]._id;
    const detailRes = http.get(`${BASE_URL}/products/${productId}`);
    check(detailRes, {
      'product detail 200': (r) => r.status === 200,
    });
  }

  sleep(2);
}
```

### Scenario 3: Trade Creation

Simulates the purchase request flow (authenticated).

```javascript
// scripts/load-tests/trade-flow.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const AUTH_COOKIE = __ENV.AUTH_COOKIE; // Pre-authenticated cookie

export const options = {
  scenarios: {
    trade_creation: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // Trade creation can be slower
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `account=${AUTH_COOKIE}`,
  };

  // Step 1: Get user trades (list page)
  const tradesRes = http.get(`${BASE_URL}/trade/user-trades`, { headers });
  check(tradesRes, {
    'trade list 200': (r) => r.status === 200,
  });

  sleep(1);

  // Step 2: Create purchase request
  const createRes = http.post(`${BASE_URL}/trade/create`, JSON.stringify({
    productId: __ENV.TEST_PRODUCT_ID,
    quantity: Math.floor(Math.random() * 100) + 10,
    pricePerUnit: Math.floor(Math.random() * 500) + 100,
    incoterm: 'FOB',
    paymentTerms: 'Letter of Credit',
    deliveryPort: 'Mumbai',
  }), { headers });

  check(createRes, {
    'trade created': (r) => r.status === 200 || r.status === 201,
  });

  sleep(3);
}
```

### Scenario 4: AI Search

Simulates the AI commodity search and analysis flow.

```javascript
// scripts/load-tests/ai-search.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const AUTH_COOKIE = __ENV.AUTH_COOKIE;

export const options = {
  scenarios: {
    ai_search: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],  // AI calls are slower
    http_req_failed: ['rate<0.10'],     // AI may have higher failure rate
  },
};

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `account=${AUTH_COOKIE}`,
  };

  const commodities = ['rice', 'wheat', 'cotton', 'sugar', 'coffee', 'turmeric', 'cashew'];
  const commodity = commodities[Math.floor(Math.random() * commodities.length)];

  // Step 1: Commodity search
  const searchRes = http.post(`${BASE_URL}/ai/commodity-search`, JSON.stringify({
    query: commodity,
  }), { headers });

  check(searchRes, {
    'commodity search 200': (r) => r.status === 200,
  });

  sleep(2);

  // Step 2: Partner search
  const partnerRes = http.post(`${BASE_URL}/ai/search`, JSON.stringify({
    commodity: commodity,
    country: 'India',
    tradeDirection: 'import',
  }), { headers });

  check(partnerRes, {
    'partner search 200': (r) => r.status === 200,
  });

  sleep(2);

  // Step 3: Start analysis (async)
  const analysisRes = http.post(`${BASE_URL}/ai/analysis/start`, JSON.stringify({
    commodity: commodity,
    country: 'India',
  }), { headers });

  if (analysisRes.status === 200 || analysisRes.status === 201) {
    const jobId = JSON.parse(analysisRes.body).data?.jobId;
    if (jobId) {
      // Poll once (don't hammer the server)
      sleep(5);
      http.get(`${BASE_URL}/ai/analysis/${jobId}`, { headers });
    }
  }

  sleep(3);
}
```

---

## 3. Load Profiles

| Profile | VUs | Duration | Purpose |
|---------|-----|----------|---------|
| **Smoke** | 5 | 1 min | Sanity check — does it work at all? |
| **Average** | 50 | 10 min | Simulate normal daily traffic |
| **Peak** | 200 | 5 min | Simulate peak hour (10x average) |
| **Stress** | 500 | 5 min | Find the breaking point |

---

## 4. Acceptance Criteria

Linked to [[operations/CAPACITY_PLANNING]] projected benchmarks.

| Metric | Smoke | Average | Peak | Stress |
|--------|-------|---------|------|--------|
| **p95 Response Time** | < 500ms | < 1s | < 2s | < 5s |
| **Error Rate** | 0% | < 1% | < 5% | < 15% |
| **Throughput** | > 5 req/s | > 50 req/s | > 200 req/s | Best effort |
| **AI p95 Response** | < 2s | < 3s | < 5s | < 10s |

**Fail criteria:** If Average load fails acceptance criteria, the system is NOT ready for production. Address bottlenecks before launching.

---

## 5. Running Tests

### Prerequisites

1. Seed test data: `npm run seed:test` (create test users, products, trades)
2. Set environment variables
3. Ensure target server is running

### Commands

```bash
# Smoke test (quick sanity check)
k6 run --vus 5 --duration 1m scripts/load-tests/product-browse.js

# Average load
k6 run scripts/load-tests/product-browse.js

# Peak load (override VUs)
k6 run --vus 200 --duration 5m scripts/load-tests/product-browse.js

# Against staging server
k6 run -e BASE_URL=https://staging-api.breyus.com scripts/load-tests/auth-flow.js

# With authenticated cookie
k6 run -e AUTH_COOKIE=eyJhbGciOiJIUzI1NiI... scripts/load-tests/trade-flow.js

# Export results to JSON
k6 run --out json=results.json scripts/load-tests/product-browse.js
```

### Reading Results

k6 outputs a summary at the end of each run:

```
http_req_duration.............: avg=245ms  min=12ms  med=198ms  max=4.2s   p(90)=450ms  p(95)=890ms
http_req_failed...............: 1.2%  (12 out of 1000)
http_reqs.....................: 1000  50/s
vus...........................: 50    min=50  max=50
```

**Key metrics to check:**
- `p(95)` — 95th percentile response time (compare to acceptance criteria)
- `http_req_failed` — Error rate (should be < 5% for average load)
- `http_reqs` — Total requests and throughput (req/s)

---

## 6. Results Template

Record each test run for comparison:

```markdown
## Load Test Results: YYYY-MM-DD

**Environment:** [staging / production]
**Server:** [DigitalOcean 4GB / 8GB]
**Commit:** [git short hash]

| Scenario | Profile | VUs | Duration | p95 (ms) | Error % | RPS | Pass? |
|----------|---------|-----|----------|----------|---------|-----|-------|
| Auth Flow | Average | 50 | 10m | | | | |
| Product Browse | Average | 50 | 5m | | | | |
| Trade Creation | Average | 10 | 5m | | | | |
| AI Search | Average | 20 | 5m | | | | |
| Product Browse | Peak | 200 | 5m | | | | |
| Product Browse | Stress | 500 | 5m | | | | |

**Bottlenecks Found:**
-

**Actions Taken:**
-
```

---

## 7. Common Bottlenecks & Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| p95 > 2s on product list | Missing MongoDB index | Add compound index on search fields |
| Error rate > 10% at 200 VUs | Connection pool exhausted | Increase Mongoose pool size |
| AI search timeouts | FastAPI worker shortage | Increase uvicorn workers (`--workers 4`) |
| Memory spikes during test | Large response payloads | Add pagination, reduce payload size |
| 502 errors at high load | Nginx upstream timeout | Increase `proxy_read_timeout` in nginx config |

---

## Related

- [[operations/CAPACITY_PLANNING]] — Projected benchmarks (validate with these tests)
- [[operations/DATABASE_MAINTENANCE]] — Fix bottlenecks found during testing
- [[operations/MONITORING_AND_ALERTING]] — Monitor during test runs
- [[MOC-Operations]]
