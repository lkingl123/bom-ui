import { test } from '@playwright/test';

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Products', path: '/products' },
  { name: 'Orders', path: '/orders' },
  { name: 'Components', path: '/components' },
  { name: 'Suppliers', path: '/suppliers' },
];

test.describe('Screenshots of all pages', () => {
  for (const page of pages) {
    test(`Screenshot - ${page.name} page`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');
      await browserPage.screenshot({ 
        path: `screenshots/${page.name.toLowerCase()}.png`,
        fullPage: true 
      });
    });
  }
});