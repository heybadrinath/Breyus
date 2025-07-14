const fetch = require('node-fetch');

async function testPaginationEndpoint() {
  try {
    console.log('Testing pagination endpoint...');
    
    // Test basic pagination
    const response = await fetch('http://localhost:3000/products/list?page=1&limit=5');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Pagination endpoint is working!');
      console.log(`Found ${data.pagination.totalProducts} total products`);
      console.log(`Current page: ${data.pagination.currentPage}`);
      console.log(`Has next page: ${data.pagination.hasNextPage}`);
    } else {
      console.log('❌ Pagination endpoint failed');
    }
  } catch (error) {
    console.error('Error testing pagination endpoint:', error.message);
  }
}

testPaginationEndpoint(); 