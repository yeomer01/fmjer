import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Firebase Initialization (Environment Aware) ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants ---
const FIXED_TERMINATED_VENDORS = ['JB(2DAY)', '가나다다', '더팩토리', '미베', '베트남', '블루진', '사과나무', '세종', '정도', '카이저'];

const USER_ACCOUNTS = [
  { id: 'djcrow', password: '12345', name: '정진수', role: 'manager', domain: 'fairplay142.com' },
  { id: 'dongil.yeom', password: '12345', name: '염동일', role: 'manager', domain: 'fairplay142.com' },
];

export { app, auth, db, appId, FIXED_TERMINATED_VENDORS, USER_ACCOUNTS };
