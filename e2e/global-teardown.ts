/**
 * Global teardown for Playwright e2e tests
 * Runs once after all tests to clean up the test environment
 */

import { FullConfig } from '@playwright/test';
import { cleanupAllTestData } from './utils/cleanup';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting global teardown for e2e tests...\n');

  // Clean up any remaining test data
  await cleanupAllTestData();

  console.log('✅ Global teardown complete\n');
}

export default globalTeardown;
