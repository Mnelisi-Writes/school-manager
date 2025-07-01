// firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyCx4S0nlJyauX7yZBIT0P2t0QQuk3Qw4PE",
    authDomain: "school-management-a8d6a.firebaseapp.com",
    projectId: "school-management-a8d6a",
    storageBucket: "school-management-a8d6a.firebasestorage.app",
    messagingSenderId: "393052782800",
    appId: "1:393052782800:web:1bde5398a2caff6fbf9ed5",
    measurementId: "G-FQP8X3REGQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
