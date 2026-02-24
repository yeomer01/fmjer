import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, appId } from '../config/firebase';

export function useActivityLogs(user) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);
  return { logs, loading };
}
