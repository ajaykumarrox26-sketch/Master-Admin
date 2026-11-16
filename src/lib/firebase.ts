import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, type Auth } from 'firebase/auth';
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5gz8dcJ2eTwVoJI8uGxqbKNrWTsDVZyw",
  authDomain: "girembo-sewa-kendra-598ed.firebaseapp.com",
  projectId: "girembo-sewa-kendra-598ed",
  storageBucket: "girembo-sewa-kendra-598ed.firebasestorage.app",
  messagingSenderId: "427828551511",
  appId: "1:427828551511:web:1fc038a196a9a64bb4e812",
  measurementId: "G-3KCTXPVMZ5"
};

const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

export const firebaseConfigured = requiredKeys.every(
  (key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key] !== '',
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.setPersistence(browserLocalPersistence);
}

export { app, auth };
