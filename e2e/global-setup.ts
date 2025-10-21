/**
 * Global setup for Playwright e2e tests
 * Runs once before all tests to prepare the test environment
 */

import { chromium, FullConfig } from '@playwright/test';
import { cleanupAllTestData } from './utils/cleanup';

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting global setup for e2e tests...\n');

  // Wait for server to be ready
  console.log('⏳ Waiting for server to be ready...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for server to respond (with retries)
    let serverReady = false;
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto('http://localhost:3000', { timeout: 5000 });
        serverReady = true;
        break;
      } catch (error) {
        console.log(`  Attempt ${i + 1}/10: Server not ready yet...`);
        await page.waitForTimeout(2000);
      }
    }

    if (!serverReady) {
      throw new Error('Server did not become ready in time');
    }

    console.log('✅ Server is ready\n');
  } finally {
    await browser.close();
  }

  // Clean up test data from previous runs
  await cleanupAllTestData();

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
