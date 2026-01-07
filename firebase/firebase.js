// firebase.js
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC3zO6jnjY_M0EHjUJOU3fQS1w5tgIdSbI",
  authDomain: "my-expo-app-8d31d.firebaseapp.com",
  projectId: "my-expo-app-8d31d",
  storageBucket: "my-expo-app-8d31d.firebasestorage.app",
  messagingSenderId: "485267423726",
  appId: "1:485267423726:web:cca0496b2b34f9b95f8eff",
  measurementId: "G-1MJJXNGVVE"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore + Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
