export const firebaseSettings = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};
export const requestedLive = import.meta.env.VITE_DEMO_MODE === 'false';
export const hasFirebaseConfiguration = Object.values(firebaseSettings).every(Boolean);
export const DEMO_MODE = !requestedLive || !hasFirebaseConfiguration;
export const CONFIG_ERROR = requestedLive && !hasFirebaseConfiguration;
