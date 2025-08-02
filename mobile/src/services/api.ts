import { authService } from "./authService";
import {
  ApiResponse,
  CreateEchoRequest,
  Echo,
  UserProfile,
  GetEchoesResponse,
} from "../types";

// Базовый URL API
// В Expo Go нужно использовать IP адрес компьютера, а не localhost
const API_BASE_URL = __DEV__
  ? "http://192.168.0.107:3000/api" // 🔧 Замените на IP вашего компьютера
  : "https://echoon.onrender.com/api";

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      // Получаем JWT токен для авторизации
      const token = await authService.getToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("🔑 Using token:", token);
      } else {
        console.log("⚠️ No token available");
      }

      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`🌐 API Request: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error(`JSON Parse error for ${endpoint}:`, parseError);
        throw new Error(
          `Server returned invalid JSON. Status: ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    // Health endpoint находится на /health, а не на /api/health
    const url = __DEV__
      ? "http://192.168.0.107:3000/health"
      : "https://your-production-api.com/health";

    try {
      const response = await fetch(url, { method: "GET" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error("Health check error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse> {
    return this.makeRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>("/auth/me", { method: "GET" });
  }

  // User Profile
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>("/user/profile", { method: "GET" });
  }

  async updateUserProfile(
    data: Partial<UserProfile>,
  ): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>("/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Echoes
  async createEcho(data: CreateEchoRequest): Promise<ApiResponse<Echo>> {
    return this.makeRequest<Echo>("/echoes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUserEchoes(
    offset = 0,
    limit = 20,
  ): Promise<ApiResponse<GetEchoesResponse>> {
    return this.makeRequest<GetEchoesResponse>(
      `/user/echoes?offset=${offset}&limit=${limit}`,
      {
        method: "GET",
      },
    );
  }

  async getEcho(echoId: string): Promise<ApiResponse<Echo>> {
    return this.makeRequest<Echo>(`/user/echoes/${echoId}`, {
      method: "GET",
    });
  }

  // File upload
  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: string,
  ): Promise<ApiResponse<{ url: string }>> {
    try {
      const token = await authService.getToken();

      // Создаем FormData для загрузки файла
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);

      const url = `${API_BASE_URL}/upload`;
      console.log(`📤 Uploading file: ${fileName}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Upload failed! status: ${response.status}`,
        );
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error("File upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // FCM Token management
  async updateFCMToken(token: string): Promise<ApiResponse> {
    return this.makeRequest("/user/tokens", {
      method: "POST",
      body: JSON.stringify({ token, platform: "mobile" }),
    });
  }

  // Register push token
  async registerPushToken(data: {
    fcmToken: string;
    deviceId?: string;
    deviceType?: string;
  }): Promise<ApiResponse> {
    console.log("📱 Registering push token:", {
      fcmToken: data.fcmToken.substring(0, 20) + "...",
      deviceId: data.deviceId,
      deviceType: data.deviceType,
    });

    const response = await this.makeRequest("/auth/register-token", {
      method: "POST",
      body: JSON.stringify(data),
    });

    console.log("📱 Push token registration result:", response);
    return response;
  }
}

export const apiService = new ApiService();
