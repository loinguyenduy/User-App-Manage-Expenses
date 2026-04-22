import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: "AIzaSyC1_iycZa8atDZ4GPnzegOdeTJ8E1we4FA", 
  authDomain: "manage-expense-comp1786.firebaseapp.com",
  databaseURL: "https://manage-expense-comp1786-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "manage-expense-comp1786",
  storageBucket: "manage-expense-comp1786.appspot.com",
  messagingSenderId: "100705275339",
  appId: "1:100705275339:web:e5a30007Q93af90a325ba4e",
  measurementId: "G-NJTCTYHR4V"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app); 