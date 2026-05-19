export type UserRole = 'user' | 'admin';

export type UserStatus = 'active' | 'suspended';

export type AuthProviderId = 'email' | 'google';

/** Firestore `users/{uid}` — role is NEVER set to admin from the client. */
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  role: UserRole;
  provider: AuthProviderId;
  status: UserStatus;
  createdAt: unknown;
}

export function isUserRole(value: unknown): value is UserRole {
  return value === 'user' || value === 'admin';
}

export function isUserStatus(value: unknown): value is UserStatus {
  return value === 'active' || value === 'suspended';
}

export function isAuthProviderId(value: unknown): value is AuthProviderId {
  return value === 'email' || value === 'google';
}
