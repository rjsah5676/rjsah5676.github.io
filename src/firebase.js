// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC-833NLKJyKbNAuIj07ZqO9lt2GYHD5UM",
    authDomain: "gunmo-portfolio.firebaseapp.com",
    projectId: "gunmo-portfolio",
    storageBucket: "gunmo-portfolio.appspot.com",
    messagingSenderId: "608990934237",
    appId: "1:608990934237:web:70f8076ec788e718a11734",
    measurementId: "G-E2V0469JW7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;
