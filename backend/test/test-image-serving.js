const fetch = require('node-fetch');

async function testImageServing() {
  try {
    console.log('Testing image serving...');
    
    // Test the pagination endpoint to get products with images
    const response = await fetch('http://localhost:3000/products/list?page=1&limit=5');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    
    if (response.ok && data.data && data.data.length > 0) {
      console.log('✅ Products endpoint is working!');
      console.log(`Found ${data.data.length} products`);
      
      // Check if any products have images
      const productsWithImages = data.data.filter(product => 
        product.productImages && product.productImages.length > 0
      );
      
      if (productsWithImages.length > 0) {
        console.log(`Found ${productsWithImages.length} products with images`);
        
        // Test image URL
        const firstImage = productsWithImages[0].productImages[0];
        const imageUrl = `http://localhost:3000/${firstImage}`;
        console.log(`Testing image URL: ${imageUrl}`);
        
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          console.log('✅ Image serving is working!');
          console.log(`Image content type: ${imageResponse.headers.get('content-type')}`);
        } else {
          console.log('❌ Image serving failed');
          console.log(`Image response status: ${imageResponse.status}`);
        }
      } else {
        console.log('⚠️ No products with images found');
      }
    } else {
      console.log('❌ Products endpoint failed');
    }
  } catch (error) {
    console.error('Error testing image serving:', error.message);
  }
}

testImageServing(); 