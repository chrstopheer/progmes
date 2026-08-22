import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { auth, firebaseConfigured, googleProvider } from "../lib/firebase";
import { setStorageUser } from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setStorageUser(null);
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setStorageUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    configured: firebaseConfigured,
    signInWithGoogle: () => {
      if (!auth) throw new Error("Firebase não está configurado.");
      const isMobile = /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
      return isMobile
        ? signInWithRedirect(auth, googleProvider)
        : signInWithPopup(auth, googleProvider);
    },
    logout: () => (auth ? signOut(auth) : Promise.resolve()),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return value;
}
