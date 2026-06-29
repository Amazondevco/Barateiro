import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type SessionUser = {
  id: string;
  email: string;
};

function toSessionUser(session: Session | null): SessionUser | null {
  if (!session?.user?.email) return null;

  return {
    id: session.user.id,
    email: session.user.email,
  };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return toSessionUser(data.session);
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function subscribeToAuthChanges(callback: (user: SessionUser | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(toSessionUser(session));
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
