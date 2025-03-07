// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "@firebase/storage";// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGSwmvPtuaQ8AuJE28SMtkNxCQWQbMyWU",
  authDomain: "cakemanager-747fb.firebaseapp.com",
  projectId: "cakemanager-747fb",
  storageBucket: "cakemanager-747fb.firebasestorage.app",
  messagingSenderId: "941042034563",
  appId: "1:941042034563:web:bd00341fc6eb572b9938b6",
  measurementId: "G-8EFRMBPC97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the storage service
const storage = getStorage(app);

export { storage };