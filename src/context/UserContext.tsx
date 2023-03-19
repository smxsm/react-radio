import { createContext, PropsWithChildren, useEffect, useState } from 'react';
import useSupabase from '../hooks/useSupabase';

type UserContextType = {
  user: any;
  signup: (email: string, firstName: string, lastName: string, password: string) => Promise<void>;
  signin: (email: string, password: string, saveSession: boolean) => Promise<void>;
  signout: () => Promise<void>;
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type UserProviderProps = PropsWithChildren & {};

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: UserProviderProps) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth
      .setSession(JSON.parse(localStorage.getItem('session') || '{}'))
      .then(() => {
        supabase.auth.refreshSession().then(({ data }) => {
          if (!data) {
            throw new Error('No user');
          }

          supabase
            .from('profiles')
            .select('*')
            .then(({ data, error }) => {
              if (error || !data.length) {
                throw new Error('Could not get user data');
              }
              setUser({
                id: data[0].id,
                email: data[0].email,
                firstName: data[0]['first_name'],
                lastName: data[0]['last_name'],
              });
            });
        });
      })
      .catch(console.error);
  }, [supabase]);

  const signup = async (email: string, firstName: string, lastName: string, password: string) => {
    const signUpResult = await supabase.auth.signUp({ email, password });
    if (signUpResult.error) {
      throw signUpResult.error;
    }

    const profileInsertResult = await supabase.from('profiles').insert({
      id: signUpResult.data.user!.id,
      email,
      first_name: firstName,
      last_name: lastName,
    });
    if (profileInsertResult.error) {
      throw signUpResult.error;
    }
  };

  const signin = async (email: string, password: string, saveSession: boolean) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    const profile = await supabase.from('profiles').select('*');
    setUser({
      id: profile.data![0].id,
      email: profile.data![0].email,
      firstName: profile.data![0]['first_name'],
      lastName: profile.data![0]['last_name'],
    });

    if (saveSession) {
      localStorage.setItem('session', JSON.stringify(data.session));
    }
  };

  const signout = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem('session');
    setUser(null);
  };

  return <UserContext.Provider value={{ user, signup, signin, signout }}>{children}</UserContext.Provider>;
}
