import { z } from "zod";

export const loginRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  isSession: z.literal(true),
  mode: z.literal("cookie"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface LoginResponse {
  success: boolean;
}

export const deskproLoginResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  idle_timeout: z.number(),
});

export type DeskproLoginResponse = z.infer<typeof deskproLoginResponseSchema>;

export interface DeskproLoginResult {
  accessToken: string;
  expiresIn: number;
  idleTimeout: number;
  deskproCookies: string[];
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: {
    id: string;
    name: string;
    displayName: string;
    email: string;
    avatar?: string;
    timezone?: string;
  } | null;
}
