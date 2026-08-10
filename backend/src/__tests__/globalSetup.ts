/**
 * Глобальный setup - выполняется один раз перед всеми тестами
 */

export default async (): Promise<void> => {
  console.log("🧪 Setting up test environment...");

  // Устанавливаем тестовые переменные окружения
  process.env.NODE_ENV = "test";
  process.env.PORT = "0"; // Случайный порт для тестов

  // Тестовые credentials
  process.env.FIREBASE_CREDENTIALS = JSON.stringify({
    type: "service_account",
    project_id: "test-project-id",
    private_key_id: "test-private-key-id",
    private_key:
      "-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----\n",
    client_email: "test@test-project.iam.gserviceaccount.com",
    client_id: "test-client-id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com",
  });

  process.env.SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

  process.env.REDIS_HOST = "localhost";
  process.env.REDIS_PORT = "6379";

  process.env.JWT_SECRET = "test-jwt-secret-do-not-use-in-production";

  console.log("✅ Test environment setup complete");
};
