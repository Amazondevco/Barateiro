import { createContext, useContext, useEffect, useState } from "react";
import { getSession, signIn, signOut, subscribeToAuthChanges, type SessionUser } from "../lib/auth";
import { registerPush, unregisterPush } from "../lib/push";
import { startAutoSync, stopAutoSync } from "../lib/auto-sync";
import { clearCache } from "../lib/offline-cache";

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
      if (sessionUser) {
        void registerPush();
        void startAutoSync();
      }
    }

    void load();

    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        void registerPush();
        void startAutoSync();
      }
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
        signOutUser: async () => {
          stopAutoSync();
          await unregisterPush();
          await clearCache();
          await signOut();
        },
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
