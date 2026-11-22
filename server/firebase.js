import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('Set FIREBASE_PROJECT_ID or configure VITE_FIREBASE_PROJECT_ID in .env.local.');

if (Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) !== Boolean(process.env.FIRESTORE_EMULATOR_HOST)) {
  throw new Error('Start both the Auth and Firestore emulators together.');
}

const app = initializeApp({ projectId });
export const auth = getAuth(app);
export const db = getFirestore(app);
