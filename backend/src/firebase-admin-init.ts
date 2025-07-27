import admin from "firebase-admin";

// Firebase Admin SDK инициализация (только для push уведомлений)
let firebaseAdmin: admin.app.App;

try {
  // Проверяем, не инициализирован ли уже Firebase Admin
  if (admin.apps.length === 0) {
    // Получаем credentials из переменной окружения
    const serviceAccount = process.env.FIREBASE_CREDENTIALS;

    if (!serviceAccount) {
      console.warn(
        "⚠️ FIREBASE_CREDENTIALS not found - push notifications will be disabled",
      );
      // Создаем mock app для совместимости
      firebaseAdmin = admin.initializeApp({
        projectId: "mock-project",
      });
    } else {
      try {
        const credentials = JSON.parse(serviceAccount);
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(credentials),
          projectId: credentials.project_id,
        });
        console.log("✅ Firebase Admin SDK initialized for push notifications");
      } catch (error) {
        console.error("❌ Failed to parse FIREBASE_CREDENTIALS:", error);
        // Создаем mock app для совместимости
        firebaseAdmin = admin.initializeApp({
          projectId: "mock-project",
        });
      }
    }
  } else {
    firebaseAdmin = admin.app();
  }
} catch (error) {
  console.error("❌ Firebase Admin initialization error:", error);
  // Создаем mock app для совместимости
  firebaseAdmin = admin.initializeApp({
    projectId: "mock-project",
  });
}

export default firebaseAdmin;
