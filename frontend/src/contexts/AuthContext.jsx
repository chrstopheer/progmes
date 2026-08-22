import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithPopup, signOut } from "firebase/auth";
import { auth, firebaseConfigured, googleProvider } from "../lib/firebase";
import { setStorageUser } from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!auth) {
      setStorageUser(null);
      setLoading(false);
      return undefined;
    }
    let active = true;
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Falha ao configurar a persistência da sessão:", error);
    });
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setStorageUser(nextUser);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    authError,
    configured: firebaseConfigured,
    signInWithGoogle: () => {
      if (!auth) throw new Error("Firebase não está configurado.");
      return setPersistence(auth, browserLocalPersistence)
        .then(() => signInWithPopup(auth, googleProvider));
    },
    logout: () => (auth ? signOut(auth) : Promise.resolve()),
  }), [user, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return value;
}
