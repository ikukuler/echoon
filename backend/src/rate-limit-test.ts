#!/usr/bin/env tsx

/**
 * Скрипт для тестирования rate limiting
 * Запуск: tsx src/rate-limit-test.ts
 */

const baseURL = process.env.BASE_URL || "http://localhost:3000";

interface TestResults {
  success: number;
  rateLimited: number;
  errors: number;
}

async function testRateLimit(
  endpoint: string,
  requests = 10,
  delay = 100,
): Promise<TestResults> {
  console.log(`\n🧪 Testing rate limit for ${endpoint}`);
  console.log(`Making ${requests} requests with ${delay}ms delay...\n`);

  const results: TestResults = {
    success: 0,
    rateLimited: 0,
    errors: 0,
  };

  for (let i = 1; i <= requests; i++) {
    try {
      const response = await fetch(`${baseURL}${endpoint}`);

      if (response.status === 429) {
        console.log(`❌ Request ${i}: Rate limited (429)`);
        results.rateLimited++;

        // Показываем заголовки rate limit
        const remaining = response.headers.get("RateLimit-Remaining");
        const reset = response.headers.get("RateLimit-Reset");
        if (remaining !== null && reset !== null) {
          console.log(
            `   Remaining: ${remaining}, Reset: ${new Date(
              parseInt(reset) * 1000,
            ).toLocaleTimeString()}`,
          );
        }
      } else if (response.ok) {
        console.log(`✅ Request ${i}: Success (${response.status})`);
        results.success++;
      } else {
        console.log(`⚠️  Request ${i}: Error (${response.status})`);
        results.errors++;
      }

      // Показываем rate limit заголовки для успешных запросов
      if (response.ok) {
        const limit = response.headers.get("RateLimit-Limit");
        const remaining = response.headers.get("RateLimit-Remaining");
        if (limit && remaining) {
          console.log(`   Rate limit: ${remaining}/${limit} remaining`);
        }
      }
    } catch (error: unknown) {
      console.log(
        `💥 Request ${i}: Network error - ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      results.errors++;
    }

    // Задержка между запросами
    if (i < requests) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(
    `\n📊 Results: ${results.success} success, ${results.rateLimited} rate limited, ${results.errors} errors`,
  );
  return results;
}

async function testHealthEndpoint(): Promise<void> {
  console.log("🏥 Testing /health endpoint (30 requests per minute limit)");
  await testRateLimit("/health", 35, 50);
}

async function testWithAuth(): Promise<void> {
  console.log(
    "\n🔐 Testing authenticated endpoints would require valid Firebase token",
  );
  console.log("To test authenticated endpoints:");
  console.log("1. Get Firebase ID token from your app");
  console.log("2. Modify this script to include Authorization header");
  console.log("3. Test endpoints like /api/echoes, /api/user/profile");
}

async function runTests(): Promise<void> {
  console.log("🚀 Rate Limiting Test Suite");
  console.log(`Testing against: ${baseURL}`);
  console.log("=".repeat(50));

  try {
    // Тест health endpoint (не требует аутентификации)
    await testHealthEndpoint();

    // Инфо о том, как тестировать аутентифицированные endpoints
    await testWithAuth();

    console.log("\n✨ Rate limiting tests completed!");
    console.log("\n💡 Tips:");
    console.log("- Rate limits reset over time");
    console.log("- Different endpoints have different limits");
    console.log("- Authenticated users get higher limits");
  } catch (error: unknown) {
    console.error(
      "❌ Test failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

// Запускаем тесты если файл запущен напрямую
if (require.main === module) {
  runTests().catch(console.error);
}

export { testRateLimit };
