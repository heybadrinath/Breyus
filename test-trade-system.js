#!/usr/bin/env node

/**
 * Trade System Test Script
 * 
 * This script tests the basic functionality of the trade management system
 * Run with: node test-trade-system.js
 */

const axios = require('axios');
const { io } = require('socket.io-client');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 10000; // 10 seconds

class TradeSystemTester {
  constructor() {
    this.sellerToken = null;
    this.buyerToken = null;
    this.socket = null;
    this.testResults = [];
  }

  async runTests() {
    console.log('🚀 Starting Trade System Tests...\n');

    try {
      await this.testApiHealth();
      await this.testAuthentication();
      await this.testTradeEndpoints();
      await this.testWebSocketConnection();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testApiHealth() {
    console.log('📡 Testing API Health...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.addResult('✅ API Health Check', 'Backend is running');
      } else {
        this.addResult('❌ API Health Check', 'Unexpected response');
      }
    } catch (error) {
      this.addResult('❌ API Health Check', `Backend not accessible: ${error.message}`);
      throw new Error('Backend is not running. Please start the backend server first.');
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    // Test if auth endpoints exist
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        this.addResult('✅ Auth Endpoint', 'Login endpoint is working (returns 401 for invalid credentials)');
      } else if (error.response?.status === 404) {
        this.addResult('❌ Auth Endpoint', 'Login endpoint not found - check auth module');
      } else {
        this.addResult('⚠️ Auth Endpoint', `Unexpected response: ${error.response?.status || error.message}`);
      }
    }
  }

  async testTradeEndpoints() {
    console.log('💼 Testing Trade Endpoints...');
    
    // Test trades endpoints without authentication (should return 401)
    const endpoints = [
      '/trades/incoming',
      '/trades/stats',
      '/trades/my-requests'
    ];

    for (const endpoint of endpoints) {
      try {
        await axios.get(`${API_BASE_URL}${endpoint}`);
        this.addResult('❌ Trade Auth', `${endpoint} should require authentication`);
      } catch (error) {
        if (error.response?.status === 401) {
          this.addResult('✅ Trade Auth', `${endpoint} properly requires authentication`);
        } else {
          this.addResult('⚠️ Trade Auth', `${endpoint} unexpected response: ${error.response?.status || error.message}`);
        }
      }
    }

    // Test POST endpoints
    try {
      await axios.post(`${API_BASE_URL}/trades`, {
        seller_id: 'test',
        product_id: 'test',
        offered_price: 100,
        quantity: 1
      });
    } catch (error) {
      if (error.response?.status === 401) {
        this.addResult('✅ Trade Creation', 'Trade creation properly requires authentication');
      } else {
        this.addResult('⚠️ Trade Creation', `Unexpected response: ${error.response?.status || error.message}`);
      }
    }
  }

  async testWebSocketConnection() {
    console.log('🔄 Testing WebSocket Connection...');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.addResult('❌ WebSocket', 'Connection timeout - WebSocket server may not be running');
        resolve();
      }, 5000);

      try {
        this.socket = io(`${API_BASE_URL}/trades`, {
          auth: { token: 'test-token' },
          timeout: 3000
        });

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.addResult('✅ WebSocket', 'Connected successfully');
          this.socket.disconnect();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          if (error.message.includes('Authentication failed') || error.message.includes('401')) {
            this.addResult('✅ WebSocket Auth', 'WebSocket properly requires authentication');
          } else {
            this.addResult('⚠️ WebSocket', `Connection error: ${error.message}`);
          }
          resolve();
        });

      } catch (error) {
        clearTimeout(timeout);
        this.addResult('❌ WebSocket', `Failed to create connection: ${error.message}`);
        resolve();
      }
    });
  }

  addResult(status, message) {
    this.testResults.push({ status, message });
    console.log(`  ${status}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status.includes('✅')).length;
    const failed = this.testResults.filter(r => r.status.includes('❌')).length;
    const warnings = this.testResults.filter(r => r.status.includes('⚠️')).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`📝 Total: ${this.testResults.length}`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.status}: ${result.message}`);
    });

    if (failed === 0) {
      console.log('\n🎉 All critical tests passed! Your trade system appears to be working correctly.');
      console.log('\n🔧 Next Steps:');
      console.log('1. Start your frontend (npm start in frontend directory)');
      console.log('2. Login as a seller');
      console.log('3. Navigate to the Trade page');
      console.log('4. Create test data using the seed script');
      console.log('5. Test real-time features by creating trade requests');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the issues above before proceeding.');
    }

    console.log('\n📚 For detailed setup instructions, see TRADE_SYSTEM_README.md');
  }
}

// Additional utility functions
function checkDependencies() {
  console.log('🔍 Checking Dependencies...');
  
  const requiredDeps = ['axios', 'socket.io-client'];
  const missing = [];
  
  for (const dep of requiredDeps) {
    try {
      require(dep);
      console.log(`  ✅ ${dep} is available`);
    } catch (error) {
      missing.push(dep);
      console.log(`  ❌ ${dep} is missing`);
    }
  }
  
  if (missing.length > 0) {
    console.log('\n💡 To install missing dependencies:');
    console.log(`npm install ${missing.join(' ')}`);
    console.log('\nOr run this test from the backend directory where dependencies are already installed.\n');
  }
  
  return missing.length === 0;
}

function showSystemInfo() {
  console.log('🖥️ System Information:');
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  API URL: ${API_BASE_URL}`);
  console.log(`  Test Timeout: ${TEST_TIMEOUT}ms\n`);
}

// Main execution
async function main() {
  console.log('🧪 Trade System Test Suite');
  console.log('=' .repeat(50));
  
  showSystemInfo();
  
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  const tester = new TradeSystemTester();
  await tester.runTests();
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧪 Trade System Test Suite

Usage: node test-trade-system.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Set API base URL (default: http://localhost:3001)

Environment Variables:
  API_URL        Base URL for the API server

Examples:
  node test-trade-system.js
  node test-trade-system.js --url http://localhost:3001
  API_URL=http://localhost:3001 node test-trade-system.js

This script tests:
  ✅ API health and connectivity
  ✅ Authentication endpoints
  ✅ Trade management endpoints
  ✅ WebSocket connectivity
  ✅ Error handling and security
`);
  process.exit(0);
}

// Handle URL override
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.API_URL = process.argv[urlIndex + 1];
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TradeSystemTester }; 