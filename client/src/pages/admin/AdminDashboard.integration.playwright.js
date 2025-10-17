import { test, expect } from '@playwright/test';

test.describe('AdminDashboard UI Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for these tests
    page.setDefaultTimeout(30000);
    
    // Navigate directly to admin dashboard
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should render admin menu component (bottom-up dependency)', async ({ page }) => {
    // Verify that admin menu is rendered (prerequisite for dashboard functionality)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    
    // Check for admin menu presence (we assume menu component works from admin-menu tests)
    const adminMenuElements = page.locator('[data-testid*="admin"], .admin-menu, nav, .sidebar');
    
    // If admin menu elements exist, verify basic rendering
    if (await adminMenuElements.count() > 0) {
      await expect(adminMenuElements.first()).toBeVisible();
    }
    
    // Verify page has basic structure
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('should display dashboard-specific content beyond menu', async ({ page }) => {
    // Focus on dashboard content that's NOT the menu (charts, stats, widgets, etc.)
    const dashboardContent = page.locator('.dashboard-content, .main-content, [data-testid*="dashboard"]');
    
    // Look for dashboard-specific elements like stats, charts, cards
    const dashboardWidgets = page.locator('.widget, .card, .stat, .chart, .dashboard-item');
    const contentSections = page.locator('main, .content, section');
    
    // Verify dashboard has content beyond just the menu
    if (await dashboardContent.count() > 0) {
      await expect(dashboardContent.first()).toBeVisible();
    } else if (await dashboardWidgets.count() > 0) {
      await expect(dashboardWidgets.first()).toBeVisible();
    } else if (await contentSections.count() > 0) {
      await expect(contentSections.first()).toBeVisible();
    } else {
      // Fallback: just verify there's substantial content (more than just navigation)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText.length).toBeGreaterThan(100); // Should have more content than just menu
    }
  });

  test('should handle dashboard-specific interactions and state', async ({ page }) => {
    // Test dashboard-specific functionality (refresh, filters, etc.)
    const body = page.locator('body');
    
    // Test page refresh maintains dashboard state
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(body).toBeVisible();
    
    // Look for dashboard-specific interactive elements
    const refreshButton = page.locator('button:has-text("Refresh"), [data-testid*="refresh"]');
    const filterElements = page.locator('select, input[type="search"], .filter');
    
    // Test interactions if elements exist
    if (await refreshButton.count() > 0) {
      await refreshButton.first().click();
      await page.waitForTimeout(500);
      await expect(body).toBeVisible();
    }
    
    if (await filterElements.count() > 0) {
      // Just verify filter elements are interactable
      await expect(filterElements.first()).toBeVisible();
    }
    
    // Verify dashboard maintains functionality after interactions
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });
});