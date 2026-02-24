import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, appId } from '../config/firebase';

export function useVendorSettings(user) {
  const [vendorConfig, setVendorConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'vendor_config');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setVendorConfig(docSnap.data().status || {});
      } else {
        setVendorConfig({});
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching vendor settings:", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const updateVendorStatus = async (vendorName, status) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'vendor_config');
    try {
      const newConfig = { ...vendorConfig, [vendorName]: status };
      await setDoc(docRef, { status: newConfig }, { merge: true });
    } catch (error) {
      console.error("Error updating vendor status:", error);
    }
  };
  return { vendorConfig, updateVendorStatus, loading };
}
