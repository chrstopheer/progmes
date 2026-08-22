import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { browserLocalPersistence, getRedirectResult, onAuthStateChanged, setPersistence, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
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

    getRedirectResult(auth)
      .then((result) => {
        if (active && result?.user) {
          setUser(result.user);
          setStorageUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Falha ao processar o retorno do Google:", error);
        if (active) setAuthError(error);
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
      const isMobile = /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
      return setPersistence(auth, browserLocalPersistence).then(() => (
        isMobile
          ? signInWithRedirect(auth, googleProvider)
          : signInWithPopup(auth, googleProvider)
      ));
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
