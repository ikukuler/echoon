import { Request } from "express";
import { DecodedIdToken } from "firebase-admin/auth";

// Database entities
export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  email_verified: boolean;
  provider: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Echo {
  id: string;
  user_id: string;
  return_at: string;
  created_at: string;
  updated_at: string;
}

export interface EchoPart {
  id: string;
  echo_id: string;
  type: EchoPartType;
  content: string;
  order_index: number;
  created_at: string;
}

export interface UserToken {
  id: string;
  user_id: string;
  fcm_token: string;
  device_id: string | null;
  device_type: DeviceType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  echo_id: string;
  user_id: string;
  notification_type: string;
  status: NotificationStatus;
  tokens_targeted: number;
  tokens_successful: number;
  error_details: string | null;
  sent_at: string;
}

// Enums
export type EchoPartType = "text" | "image" | "audio" | "link";
export type DeviceType = "ios" | "android" | "web" | "unknown";
export type NotificationStatus = "sent" | "failed" | "pending";

// API Request/Response types
export interface CreateEchoRequest {
  return_at?: string; // Опциональное поле - если не предоставлено, генерируется случайная дата
  parts: Array<{
    type: EchoPartType;
    content: string;
    order_index?: number;
  }>;
}

export interface CreateEchoResponse {
  message: string;
  echo: {
    id: string;
    user_id: string;
    return_at: string;
    parts_count: number;
    parts: Array<{
      id: string;
      type: EchoPartType;
      content: string;
      order_index: number;
    }>;
  };
}

export interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    photoUrl: string | null;
    emailVerified: boolean;
    provider: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  };
  stats: {
    totalEchoes: number;
    activeTokens: number;
  };
}

export interface UpdateProfileRequest {
  displayName?: string;
}

export interface RegisterTokenRequest {
  fcmToken: string;
  deviceId?: string;
  deviceType?: DeviceType;
}

export interface RegisterTokenResponse {
  message: string;
  token: {
    id: string;
    deviceId: string | null;
    deviceType: DeviceType;
    isActive: boolean;
  };
}

export interface GetEchoesQuery {
  limit?: string;
  offset?: string;
}

export interface GetEchoesResponse {
  echoes: Array<{
    id: string;
    return_at: string;
    created_at: string;
    parts: Array<{
      id: string;
      type: EchoPartType;
      content: string;
      order_index: number;
    }>;
  }>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Firebase types
export interface FirebaseUser {
  uid: string;
  email: string | null;
  email_verified: boolean;
  name: string | null;
  picture: string | null;
  provider: string;
}

// Extended Express Request types
export interface AuthenticatedRequest extends Request {
  firebaseUser?: FirebaseUser;
  user?: User;
  userId?: string;
}

// BullMQ Job types
export interface EchoJobData {
  echoId: string;
  userId: string;
}

export interface EchoJobResult {
  success: boolean;
  echoId: string;
  userId: string;
  messageContent: string;
  pushResult: PushNotificationResult;
}

// Push notification types
export interface PushNotificationResult {
  success: boolean;
  successCount?: number;
  failureCount?: number;
  totalTokens: number;
  failures?: Array<{
    deviceId: string | null;
    token: string;
    error: string;
  }>;
  error?: string;
  reason?: string;
}

export interface FCMTokenInfo {
  token: string;
  deviceId: string | null;
}

// Error types
export interface ApiError {
  error: string;
  code: string;
  retryAfter?: string;
  requestId?: string;
}

// Health check types
export interface HealthCheckResponse {
  status: "OK" | "Service Unavailable";
  timestamp: string;
  services?: {
    firebase: string;
    supabase: string;
    redis: string;
    queue: string;
  };
  error?: string;
}

// Environment variables types
export interface EnvConfig {
  PORT: string;
  FIREBASE_CREDENTIALS: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_PASSWORD?: string;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DatabaseTimestamp = string; // ISO string from database
