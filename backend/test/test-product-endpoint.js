const fs = require('fs');
const path = require('path');

// Simple test to verify the uploads directory structure
console.log('Testing product endpoint setup...');

// Check if uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const productImagesDir = path.join(uploadsDir, 'product-images');
const testReportsDir = path.join(uploadsDir, 'test-reports');

console.log('Checking uploads directory structure...');

if (!fs.existsSync(uploadsDir)) {
  console.log('❌ uploads directory does not exist');
} else {
  console.log('✅ uploads directory exists');
}

if (!fs.existsSync(productImagesDir)) {
  console.log('❌ product-images directory does not exist');
} else {
  console.log('✅ product-images directory exists');
}

if (!fs.existsSync(testReportsDir)) {
  console.log('❌ test-reports directory does not exist');
} else {
  console.log('✅ test-reports directory exists');
}

console.log('\nProduct endpoint setup verification complete!');
console.log('\nTo test the actual endpoint:');
console.log('1. Start the backend server: npm run start:dev');
console.log('2. Ensure you have a valid JWT token in cookies');
console.log('3. Send a POST request to /products/add-product with form data');
console.log('4. Include product data and files in the request'); 