#!/usr/bin/env node
/**
 * Data Validation Test - Compares UI data with API data
 */

async function validateData() {
  console.log('🔍 Data Validation Test - UI vs API\n');
  
  const API_URL = 'http://localhost:8000';
  const UI_URL = 'http://localhost:3000';
  
  try {
    // 1. Get data directly from API
    console.log('Fetching from API...');
    const apiResponse = await fetch(`${API_URL}/products`);
    const apiProducts = await apiResponse.json();
    console.log(`✅ API returned ${apiProducts.length} products`);
    
    // 2. Get summary from API
    const summaryResponse = await fetch(`${API_URL}/summary`);
    const summary = await summaryResponse.json();
    console.log(`✅ API Summary: ${summary.products.total_with_complete_costs} complete products`);
    
    // 3. Check if UI is using local or prod API
    console.log('\nChecking UI configuration...');
    const uiResponse = await fetch(`${UI_URL}/products`);
    const htmlContent = await uiResponse.text();
    
    const usesLocalAPI = htmlContent.includes('localhost:8000');
    const usesProductionAPI = htmlContent.includes('bom-api.fly.dev');
    
    if (usesLocalAPI) {
      console.log('✅ UI is configured to use LOCAL API (localhost:8000)');
    } else if (usesProductionAPI) {
      console.log('⚠️  UI is still using PRODUCTION API (bom-api.fly.dev)');
      console.log('   To use local API, ensure .env.development is loaded');
    }
    
    // 4. Sample data validation
    console.log('\n📊 Sample Product Data:');
    const sampleProducts = apiProducts.slice(0, 3);
    for (const product of sampleProducts) {
      console.log(`\n  ${product.name}`);
      console.log(`    Cost: $${product.cost}`);
      console.log(`    Components: ${product.components}`);
      console.log(`    SKU: ${product.sku || '(none)'}`);
    }
    
    // 5. Cost validation
    console.log('\n💰 Cost Analysis:');
    const totalValue = apiProducts.reduce((sum, p) => sum + p.cost, 0);
    console.log(`  Total value of all products: $${totalValue.toFixed(2)}`);
    console.log(`  Average cost per product: $${(totalValue / apiProducts.length).toFixed(2)}`);
    
    const highestCost = Math.max(...apiProducts.map(p => p.cost));
    const lowestCost = Math.min(...apiProducts.map(p => p.cost));
    console.log(`  Highest cost product: $${highestCost.toFixed(2)}`);
    console.log(`  Lowest cost product: $${lowestCost.toFixed(2)}`);
    
    // 6. Validate specific bulk products
    console.log('\n🔍 Bulk Product Validation:');
    const bulkProducts = apiProducts.filter(p => p.name.includes('[Bulk]') || p.name.includes('[BULK]'));
    console.log(`  Found ${bulkProducts.length} bulk products`);
    
    if (bulkProducts.length > 0) {
      const sampleBulk = bulkProducts[0];
      const detailResponse = await fetch(`${API_URL}/products/${encodeURIComponent(sampleBulk.name)}`);
      const detail = await detailResponse.json();
      
      console.log(`\n  Sample: ${sampleBulk.name}`);
      console.log(`    Components in detail: ${detail.components.length}`);
      console.log(`    Calculated cost: $${detail.calculated_cost}`);
      
      // Verify component costs add up
      const componentTotal = detail.components
        .filter(c => c.has_cost)
        .reduce((sum, c) => sum + c.line_cost, 0);
      
      const difference = Math.abs(componentTotal - detail.calculated_cost);
      if (difference < 0.01) {
        console.log(`    ✅ Component costs correctly sum to total`);
      } else {
        console.log(`    ⚠️  Component sum mismatch: $${difference.toFixed(4)}`);
      }
    }
    
    console.log('\n✅ Validation Complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   Make sure both servers are running:');
      console.error('   - API: http://localhost:8000');
      console.error('   - UI:  http://localhost:3000');
    }
  }
}

validateData();