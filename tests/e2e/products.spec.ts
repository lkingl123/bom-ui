import { test, expect } from '@playwright/test';

test.describe('Products', () => {
  test('should load the products page', async ({ page }) => {
    await page.goto('/products');
    
    await expect(page).toHaveTitle(/Pure Labs Catalog/);
    
    const heading = page.locator('h2').first();
    await expect(heading).toContainText('Product Catalog');
    
    const productCount = page.locator('text=/\\d+ products available/');
    await expect(productCount).toBeVisible();
  });

  test('should navigate to product detail', async ({ page }) => {
    await page.goto('/products');
    
    await page.waitForSelector('a[href^="/products/"]', { timeout: 10000 });
    const firstProductLink = page.locator('a[href^="/products/"]').first();
    await firstProductLink.click();
    
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/products\/.+/);
  });

  test('should display product detail page', async ({ page }) => {
    await page.goto('/products/Moo%20Elixir%20Vitamin%20C%20Serum%20-%20%20%5BBULK%5D');
    
    await page.waitForLoadState('networkidle');
    
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    const ingredientTable = page.locator('table');
    await expect(ingredientTable).toBeVisible();
    
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();
  });
});