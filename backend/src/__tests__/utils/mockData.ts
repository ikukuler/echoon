/**
 * Mock data для тестов
 */

import {
  CreateEchoRequest,
  CreateEchoResponse,
  UserProfileResponse,
} from "../../types";

// Mock Firebase user data
export const mockFirebaseUser = {
  uid: "firebase-uid-123",
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/photo.jpg",
  email_verified: true,
};

// Mock Supabase responses
export const mockSupabaseResponses = {
  user: {
    data: {
      id: "user-uuid-123",
      firebase_uid: "firebase-uid-123",
      email: "test@example.com",
      display_name: "Test User",
      photo_url: "https://example.com/photo.jpg",
      email_verified: true,
      provider: "google",
      is_active: true,
      last_login_at: "2024-01-15T10:30:00Z",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    error: null,
  },

  echo: {
    data: {
      id: "echo-uuid-123",
      user_id: "user-uuid-123",
      return_at: "2024-12-25T10:00:00Z",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    error: null,
  },

  echoParts: {
    data: [
      {
        id: "part-uuid-1",
        echo_id: "echo-uuid-123",
        type: "text",
        content: "Test echo content",
        order_index: 0,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z",
      },
      {
        id: "part-uuid-2",
        echo_id: "echo-uuid-123",
        type: "image",
        content: "https://example.com/image.jpg",
        order_index: 1,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z",
      },
    ],
    error: null,
  },

  userTokens: {
    data: [
      {
        id: "token-uuid-1",
        user_id: "user-uuid-123",
        fcm_token: "fcm-token-ios-123",
        device_id: "device-ios-123",
        device_type: "ios",
        is_active: true,
        last_used_at: "2024-01-15T10:30:00Z",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z",
      },
      {
        id: "token-uuid-2",
        user_id: "user-uuid-123",
        fcm_token: "fcm-token-android-123",
        device_id: "device-android-123",
        device_type: "android",
        is_active: true,
        last_used_at: "2024-01-15T09:00:00Z",
        created_at: "2024-01-14T10:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
      },
    ],
    error: null,
  },
};

// Mock API requests
export const mockCreateEchoRequest: CreateEchoRequest = {
  return_at: "2024-12-25T10:00:00Z",
  parts: [
    {
      type: "text",
      content: "Test echo message",
    },
    {
      type: "image",
      content: "https://example.com/test-image.jpg",
    },
  ],
};

export const mockCreateEchoResponse: CreateEchoResponse = {
  message: "Echo created successfully",
  echo: {
    id: "echo-uuid-123",
    user_id: "user-uuid-123",
    return_at: "2024-12-25T10:00:00Z",
    parts_count: 2,
    parts: [
      {
        id: "part-uuid-1",
        type: "text",
        content: "Test echo message",
        order_index: 0,
      },
      {
        id: "part-uuid-2",
        type: "image",
        content: "https://example.com/test-image.jpg",
        order_index: 1,
      },
    ],
  },
};

export const mockUserProfileResponse: UserProfileResponse = {
  user: {
    id: "user-uuid-123",
    email: "test@example.com",
    displayName: "Test User",
    photoUrl: "https://example.com/photo.jpg",
    emailVerified: true,
    provider: "google",
    isActive: true,
    lastLoginAt: "2024-01-15T10:30:00Z",
    createdAt: "2024-01-01T10:00:00Z",
  },
  stats: {
    totalEchoes: 5,
    activeTokens: 2,
  },
};

// Mock Firebase messaging responses
export const mockFirebaseMessagingResponse = {
  messageId: "firebase-message-id-123",
  results: [
    {
      messageId: "firebase-message-id-123",
      error: null,
    },
  ],
  canonicalRegistrationTokenCount: 0,
  failureCount: 0,
  successCount: 1,
};

// Mock BullMQ job data
export const mockJobData = {
  echoId: "echo-uuid-123",
  userId: "user-uuid-123",
};

export const mockJobResponse = {
  id: "job-id-123",
  name: "echo-notification",
  data: mockJobData,
  progress: 0,
  delay: 86400000, // 24 hours
  timestamp: Date.now(),
  attemptsMade: 0,
  finishedOn: null,
  processedOn: null,
};

// Mock health check responses
export const mockHealthResponse = {
  status: "OK",
  timestamp: "2024-01-15T10:30:00Z",
  services: {
    firebase: "initialized",
    supabase: "connected",
    redis: "connected",
    queue: "active",
  },
};

export const mockHealthErrorResponse = {
  status: "Service Unavailable",
  timestamp: "2024-01-15T10:30:00Z",
  error: "Redis connection failed",
};

// Invalid request data для тестирования валидации
export const invalidRequests = {
  createEcho: {
    missingReturnAt: {
      parts: [{ type: "text", content: "test" }],
    },
    missingParts: {
      returnAt: "2024-12-25T10:00:00Z",
    },
    invalidReturnAt: {
      returnAt: "invalid-date",
      parts: [{ type: "text", content: "test" }],
    },
    emptyParts: {
      returnAt: "2024-12-25T10:00:00Z",
      parts: [],
    },
    invalidPartType: {
      returnAt: "2024-12-25T10:00:00Z",
      parts: [{ type: "invalid-type", content: "test" }],
    },
    missingPartContent: {
      returnAt: "2024-12-25T10:00:00Z",
      parts: [{ type: "text" }],
    },
  },

  registerToken: {
    missingFcmToken: {
      deviceId: "device-123",
      deviceType: "ios",
    },
    invalidDeviceType: {
      fcmToken: "fcm-token-123",
      deviceId: "device-123",
      deviceType: "invalid-type",
    },
  },
};
