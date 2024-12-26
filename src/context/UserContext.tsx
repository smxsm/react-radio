import { createContext, PropsWithChildren, useEffect, useState } from 'react';
import * as api from '../lib/api';

type UserContextType = {
  user: api.User | null;
  loading: boolean;
  signup: (email: string, firstName: string, lastName: string, password: string) => Promise<null | Error>;
  signin: (email: string, password: string, saveSession: boolean) => Promise<null | Error>;
  signout: () => Promise<void>;
};

type UserProviderProps = PropsWithChildren & {};

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<api.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [persistSession, setPersistSession] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Get user profile using session
    api.getProfile(sessionId)
      .then(({ user }) => {
        setUser(user);
      })
      .catch(() => {
        localStorage.removeItem('sessionId');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signup = async (email: string, firstName: string, lastName: string, password: string) => {
    try {
      setLoading(true);
      const result = await api.signup(email, firstName, lastName, password);
      
      if (persistSession) {
        localStorage.setItem('sessionId', result.session.id);
      }
      
      setUser(result.user);
      setLoading(false);
      return null;
    } catch (error) {
      setLoading(false);
      return error instanceof Error ? error : new Error('Failed to sign up');
    }
  };

  const signin = async (email: string, password: string, saveSession: boolean = true) => {
    try {
      setLoading(true);
      setPersistSession(saveSession);
      
      const result = await api.signin(email, password);

      if (saveSession) {
        localStorage.setItem('sessionId', result.session.id);
      }
      
      setUser(result.user);
      setLoading(false);
      return null;
    } catch (error) {
      setLoading(false);
      return error instanceof Error ? error : new Error('Failed to sign in');
    }
  };

  const signout = async () => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        await api.signout(sessionId);
        localStorage.removeItem('sessionId');
      }
      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  return <UserContext.Provider value={{ user, loading, signup, signin, signout }}>{children}</UserContext.Provider>;
}
