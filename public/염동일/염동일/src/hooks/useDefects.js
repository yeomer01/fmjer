import { useState, useEffect } from 'react';
import { signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { auth, db, appId } from '../config/firebase';

export function useDefects() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        try {
          await signInAnonymously(auth);
        } catch (anonError) {
          console.error("Anonymous auth failed:", anonError);
        }
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      if (authReady) setLoading(false);
      return;
    }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'defects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, authReady]);

  return { user, data, loading, setData };
}
