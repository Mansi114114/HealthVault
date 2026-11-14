import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { DEMO_MODE, firebaseSettings } from './config';

const app = DEMO_MODE ? null : initializeApp(firebaseSettings);
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
