export interface User {
  id: string;
  name: string;
  displayName: string;
  email: string;
  avatar?: string;
  timezone?: string;
}

export interface DeskproUserRaw {
  id: string;
  name: string;
  display_name: string;
  primary_email: string;
  avatar?: string | null;
  timezone?: string | null;
}

export function mapDeskproUserToUser(raw: DeskproUserRaw): User {
  return {
    id: raw.id,
    name: raw.name,
    displayName: raw.display_name,
    email: raw.primary_email,
    avatar: raw.avatar ?? undefined,
    timezone: raw.timezone ?? undefined,
  };
}
