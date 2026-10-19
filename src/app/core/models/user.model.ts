export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  field?: string | null;
  level?: string | null;
  avatar?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
  activity?: { conversations: number; messages: number };
}
