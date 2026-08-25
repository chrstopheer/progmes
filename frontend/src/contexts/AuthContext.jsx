import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithPopup, signOut } from "firebase/auth";
import { auth, firebaseConfigured, googleProvider } from "../lib/firebase";
import { getLocalMode, setLocalMode, setStorageUser } from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [localAccess, setLocalAccess] = useState(getLocalMode());
  const [loading, setLoading] = useState(firebaseConfigured && !getLocalMode());

  useEffect(() => {
    if (getLocalMode()) {
      setLocalAccess(true);
      setStorageUser(null);
      setLoading(false);
      return undefined;
    }
    if (!auth) { setStorageUser(null); setLoading(false); return undefined; }
    let active = true;
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      if (process.env.NODE_ENV !== "production") console.error("Falha ao configurar a persistência da sessão:", error);
    });
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setLocalAccess(false);
      setStorageUser(nextUser);
      setLoading(false);
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const value = useMemo(() => ({
    user, localAccess, loading, configured: firebaseConfigured,
    enterLocalAccess: () => { setLocalMode(true); setLocalAccess(true); setUser(null); setLoading(false); },
    signInWithGoogle: () => {
      if (!auth) throw new Error("Firebase não está configurado.");
      setLocalMode(false);
      return setPersistence(auth, browserLocalPersistence).then(() => signInWithPopup(auth, googleProvider));
    },
    logout: () => { setLocalMode(false); setLocalAccess(false); return auth ? signOut(auth) : Promise.resolve(); },
  }), [user, localAccess, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return value;
}
