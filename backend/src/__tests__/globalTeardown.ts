/**
 * Глобальный teardown - выполняется один раз после всех тестов
 */

export default async (): Promise<void> => {
  console.log("🧹 Cleaning up test environment...");

  // Даем время для закрытия всех соединений
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("✅ Test environment cleanup complete");
};
