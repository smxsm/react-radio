import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { DatabaseFactory } from './database-factory';
import type { Request } from 'express';

const SALT_ROUNDS = 10;
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accessLevel: number;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  externalIdent: string

): Promise<User> {
  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const db = await DatabaseFactory.getInstance();

  await db.createUser({
    id,
    email,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName,
    external_ident: externalIdent,
  });

  return {
    id,
    email,
    firstName,
    lastName,
    accessLevel: 0,
  };
}

export function isAuthenticated (req: Request): boolean {
  const authHeader = req.header('X-Authentication-Token');

  // for now allow OPTIONS and GET
  if (req.method === 'OPTIONS' || req.method === 'GET') return true;

  if (!authHeader) {
    console.log('No X-Authentication-Token header present');
    return false;
  }

  // Check for Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].trim() !== 'Bearer') {
    console.log('No Bearer token present');
    return false;
  }

  const token = parts[1];

  const isValidToken = token === process.env.CLIENT_SECRET_TOKEN || false;

  return isValidToken;
}
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await DatabaseFactory.getInstance();
  const user = await db.getUserByEmail(email);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    accessLevel: user.access_level,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await DatabaseFactory.getInstance();
  const user = await db.getUserById(id);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    accessLevel: user.access_level,
  };
}

export async function createSession(userId: string): Promise<Session> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const db = await DatabaseFactory.getInstance();

  await db.createSession({
    id,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
  });

  return {
    id,
    userId,
    expiresAt,
  };
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const db = await DatabaseFactory.getInstance();
  const session = await db.getSession(sessionId);
  if (!session) return null;

  return {
    id: session.id,
    userId: session.user_id,
    expiresAt: new Date(session.expires_at),
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await DatabaseFactory.getInstance();
  await db.deleteSession(sessionId);
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const db = await DatabaseFactory.getInstance();
  await db.deleteUserSessions(userId);
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: User; session: Session } | null> {
  const db = await DatabaseFactory.getInstance();
  const dbUser = await db.getUserByEmail(email);
  if (!dbUser) return null;

  const passwordMatches = await comparePasswords(password, dbUser.password_hash);
  if (!passwordMatches) return null;

  const user = {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    accessLevel: dbUser.access_level,
  };

  const session = await createSession(user.id);
  return { user, session };
}
