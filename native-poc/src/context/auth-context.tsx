import { createContext, useContext, useEffect, useState } from "react";
import { getSession, signIn, signOut, subscribeToAuthChanges, type SessionUser } from "../lib/auth";

type AuthContextValue = {
  loading: boolean;
  user: SessionUser | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const sessionUser = await getSession();
      if (!mounted) return;
      setUser(sessionUser);
      setLoading(false);
    }

    void load();

    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        signInWithPassword: signIn,
        signOutUser: signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return ctx;
}
