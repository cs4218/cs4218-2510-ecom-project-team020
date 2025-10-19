/**
 * Cleanup utilities for e2e tests
 * Handles removal of test data from the real database
 */

const ADMIN_CREDENTIALS = {
  email: 'gerald@gmail.com',
  password: 'Testing#'
};

/**
 * Login and get auth token
 */
async function loginAndGetToken(): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:6060/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ADMIN_CREDENTIALS),
    });

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Delete all test categories (categories with names containing timestamps or test patterns)
 */
export async function cleanupTestCategories(): Promise<void> {
  console.log('🧹 Cleaning up test categories...');
  
  const token = await loginAndGetToken();
  if (!token) {
    console.error('❌ Failed to get auth token for cleanup');
    return;
  }

  try {
    // Get all categories
    const response = await fetch('http://localhost:6060/api/v1/category/get-category');
    const data = await response.json();

    if (!data.success || !data.categories) {
      console.log('No categories found');
      return;
    }

    // Filter test categories (names containing common test patterns)
    const testPatterns = [
      /E2E Test/i,
      /Test Category/i,
      /Duplicate Test/i,
      /Special-Test/i,
      /Session Test/i,
      /\d{13}/, // Timestamp pattern (13 digits)
    ];

    const testCategories = data.categories.filter((cat: any) => 
      testPatterns.some(pattern => pattern.test(cat.name))
    );

    console.log(`Found ${testCategories.length} test categories to clean up`);

    // Delete each test category
    for (const category of testCategories) {
      try {
        const deleteResponse = await fetch(
          `http://localhost:6060/api/v1/category/delete-category/${category._id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
            },
          }
        );

        const deleteData = await deleteResponse.json();
        if (deleteData.success) {
          console.log(`  ✓ Deleted category: ${category.name}`);
        } else {
          console.log(`  ✗ Failed to delete category: ${category.name}`);
        }
      } catch (error) {
        console.error(`  ✗ Error deleting category ${category.name}:`, error);
      }
    }

    console.log('✅ Test categories cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup test categories:', error);
  }
}

/**
 * Delete all test products (products with names containing timestamps or test patterns)
 */
export async function cleanupTestProducts(): Promise<void> {
  console.log('🧹 Cleaning up test products...');
  
  const token = await loginAndGetToken();
  if (!token) {
    console.error('❌ Failed to get auth token for cleanup');
    return;
  }

  try {
    // Get all products
    const response = await fetch('http://localhost:6060/api/v1/product/get-product');
    const data = await response.json();

    if (!data.success || !data.products) {
      console.log('No products found');
      return;
    }

    // Filter test products
    const testPatterns = [
      /E2E Test/i,
      /Test Product/i,
      /Update Test/i,
      /\d{13}/, // Timestamp pattern
    ];

    const testProducts = data.products.filter((product: any) => 
      testPatterns.some(pattern => pattern.test(product.name))
    );

    console.log(`Found ${testProducts.length} test products to clean up`);

    // Delete each test product
    for (const product of testProducts) {
      try {
        const deleteResponse = await fetch(
          `http://localhost:6060/api/v1/product/delete-product/${product._id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
            },
          }
        );

        const deleteData = await deleteResponse.json();
        if (deleteData.success) {
          console.log(`  ✓ Deleted product: ${product.name}`);
        } else {
          console.log(`  ✗ Failed to delete product: ${product.name}`);
        }
      } catch (error) {
        console.error(`  ✗ Error deleting product ${product.name}:`, error);
      }
    }

    console.log('✅ Test products cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup test products:', error);
  }
}

/**
 * Cleanup all test data (categories and products)
 */
export async function cleanupAllTestData(): Promise<void> {
  console.log('\n🧹 Starting full test data cleanup...\n');
  await cleanupTestCategories();
  await cleanupTestProducts();
  console.log('\n✅ Full cleanup complete\n');
}
