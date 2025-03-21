import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';  // Import for Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyBUBKDW3p3p_y-UL1B5avjrEwkkSBpTKPk",
  authDomain: "documentor-a37cc.firebaseapp.com",
  databaseURL: "https://documentor-a37cc-default-rtdb.firebaseio.com",  // URL for Realtime Database
  projectId: "documentor-a37cc",
  storageBucket: "documentor-a37cc.firebasestorage.app",
  messagingSenderId: "960324799802",
  appId: "1:960324799802:web:fb1111a36e3c7d87361403",
  measurementId: "G-MWCFYQM8E7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);  // Use Realtime Database

export { auth, db };  // Export db for use in your application
