import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBGSwmvPtuaQ8AuJE28SMtkNxCQWQbMyWU",
    authDomain: "cakemanager-747fb.firebaseapp.com",
    projectId: "cakemanager-747fb",
    storageBucket: "cakemanager-747fb.appspot.com",
    messagingSenderId: "941042034563",
    appId: "1:941042034563:web:bd00341fc6eb572b9938b6",
    measurementId: "G-8EFRMBPC97"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default firebaseConfig;
export { storage };