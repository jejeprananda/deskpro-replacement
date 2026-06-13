export interface UserSession {
  authenticated: boolean;
  accessToken: string;
  expiresIn: number;
  idleTimeout: number;
  agentId: string;
  agentTeamId: string;
  user: {
    id: string;
    name: string;
    displayName: string;
    email: string;
    avatar?: string;
    timezone?: string;
  };
  deskproCookies: string[];
}
