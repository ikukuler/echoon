// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Echo types
export interface Echo {
  id: string;
  user_id: string;
  return_at: string;
  created_at: string;
  updated_at: string;
  parts?: EchoPart[];
}

export interface EchoPart {
  id: string;
  echo_id: string;
  type: "text" | "image" | "audio" | "link";
  content: string;
  order_index: number;
  created_at: string;
}

// Extended EchoPart for local use (with file handling)
export interface LocalEchoPart {
  type: "text" | "image" | "audio" | "link";
  content: string;
  localUri?: string;
  fileName?: string;
  duration?: number;
}

export interface CreateEchoRequest {
  return_at?: string; // Опциональное поле - если не предоставлено, генерируется случайная дата
  parts: Array<{
    type: EchoPart["type"];
    content: string;
    order_index?: number;
  }>;
}

// API Response types for echoes
export interface GetEchoesResponse {
  echoes: Echo[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateEcho: undefined;
  EchoDetail: { echo: Echo };
  UserSettings: undefined;
  Profile: undefined;
};

// Auth Context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
