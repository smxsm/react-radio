import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { statements } from './database';
import type { Request } from 'express';

const SALT_ROUNDS = 10;
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
}

interface DbSession {
  id: string;
  user_id: string;
  expires_at: string;
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
  password: string
): Promise<User> {
  const id = randomUUID();
  const passwordHash = await hashPassword(password);

  statements.createUser.run({
    id,
    email,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName,
  });

  return {
    id,
    email,
    firstName,
    lastName,
  };
}

export function isAuthenticated (req: Request): boolean {
  const authHeader = req.header('X-Authentication-Token');

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
  console.log('Token valid? ' + isValidToken);

  return isValidToken;
}
export function getUserByEmail(email: string): User | null {
  const user = statements.getUserByEmail.get(email) as DbUser | undefined;
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
  };
}

export function getUserById(id: string): User | null {
  const user = statements.getUserById.get(id) as DbUser | undefined;
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
  };
}

export async function createSession(userId: string): Promise<Session> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  statements.createSession.run({
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

export function getSession(sessionId: string): Session | null {
  const session = statements.getSession.get(sessionId) as DbSession | undefined;
  if (!session) return null;

  return {
    id: session.id,
    userId: session.user_id,
    expiresAt: new Date(session.expires_at),
  };
}

export function deleteSession(sessionId: string): void {
  statements.deleteSession.run(sessionId);
}

export function deleteUserSessions(userId: string): void {
  statements.deleteUserSessions.run(userId);
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: User; session: Session } | null> {
  const dbUser = statements.getUserByEmail.get(email) as DbUser | undefined;
  if (!dbUser) return null;

  const passwordMatches = await comparePasswords(password, dbUser.password_hash);
  if (!passwordMatches) return null;

  const user = {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
  };

  const session = await createSession(user.id);
  return { user, session };
}
