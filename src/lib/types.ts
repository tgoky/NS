import type { UserRole } from "@/db/schema";

export interface UserPermissions {
  role: UserRole;
  canListItems: boolean;
  canRequestItems: boolean;
  canViewAddress: boolean; // Only verified users can see pickup address
  canMessageUsers: boolean;
  maxActiveListings: number;
}

export interface RegistrationFormData {
  email: string;
  username: string;
  password: string;
  fullName: string;
  location: string;
  role: UserRole;
  bio?: string;
  avatar?: string;
  preferredCategories?: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
  };
}
