import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  // Assuming the app is running
  await page.goto('http://localhost:5173/login');
  
  // Fill credentials
  await page.fill('input[placeholder="username"]', 'admin');
  await page.fill('input[placeholder="password"]', 'password');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Check redirect
  await expect(page).toHaveURL('http://localhost:5173/');
  
  // Check if dashboard loaded
  await expect(page.getByText('My Account')).toBeVisible();
});

test('admin access', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder="username"]', 'admin');
  await page.fill('input[placeholder="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Navigate to admin
  await page.click('text=Admin Console');
  await expect(page).toHaveURL('http://localhost:5173/admin');
  await expect(page.getByText('Batch Import')).toBeVisible();
});
