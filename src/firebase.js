import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const configured = Object.values(config).every((value) => value?.trim());
export const auth = configured ? getAuth(initializeApp(config)) : null;

const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL;
if (auth && import.meta.env.DEV && authEmulatorUrl) {
  connectAuthEmulator(auth, authEmulatorUrl);
}
