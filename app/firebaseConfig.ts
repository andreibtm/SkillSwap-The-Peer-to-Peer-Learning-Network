import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCFU3bScT7HmqUdxCRnUxk4xuHErBA_7jk",
  authDomain: "skillswap-75099.firebaseapp.com",
  projectId: "skillswap-75099",
  storageBucket: "skillswap-75099.firebasestorage.app",
  messagingSenderId: "837261313074",
  appId: "1:837261313074:web:102e1728624d8950ffa82b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Try to initialize auth with persistence, fallback to default if it fails
let auth: Auth;
try {
  // @ts-ignore - Firebase may export this in some builds
  const { getReactNativePersistence } = require('firebase/auth');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  // Fallback to regular auth if React Native persistence is not available
  auth = getAuth(app);
}

// Initialize other Firebase services
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { auth, db, storage };
export default app;