import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'sayedi_tower_jwt_secret_key_bangladesh_2026';
const TOKEN_NAME = 'sayedi_token';

export interface UserSession {
  userId: string;
  username: string;
  email?: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TENANT';
  flatId?: string | null;
  flatCode?: string | null;
}

export function signSessionToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAdminSession(): Promise<UserSession> {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('UNAUTHORIZED_ADMIN');
  }
  return session;
}

export async function requireTenantSession(flatIdOrCode?: string): Promise<UserSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  // Admins can view any tenant
  if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') {
    return session;
  }

  // Tenants can only access their own flat
  if (session.role === 'TENANT') {
    if (flatIdOrCode && session.flatId !== flatIdOrCode && session.flatCode?.toLowerCase() !== flatIdOrCode.toLowerCase()) {
      throw new Error('FORBIDDEN_FLAT_ACCESS');
    }
  }

  return session;
}
