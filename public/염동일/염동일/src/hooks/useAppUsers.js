import { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { auth, db, appId } from '../config/firebase';

export function useAppUsers() {
  const [appUsers, setAppUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubSnapshot = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) { unsubSnapshot(); unsubSnapshot = null; }
      if (!user) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'));
      unsubSnapshot = onSnapshot(q, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data(), isCustom: true });
        });
        setAppUsers(users);
        setLoading(false);
      }, (error) => {
        console.warn("Error fetching app users:", error);
        setLoading(false);
      });
    });
    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);
  return { appUsers, loading };
}
