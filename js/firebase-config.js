/* ============================================
   Firebase 설정
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBCPZ-Y5I20qgph6aTdhf0TaqIVNc025Nk",
  authDomain: "ganghan-wage.firebaseapp.com",
  databaseURL: "https://ganghan-wage-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ganghan-wage",
  storageBucket: "ganghan-wage.firebasestorage.app",
  messagingSenderId: "578579934612",
  appId: "1:578579934612:web:21b07f555d813deef2b381"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
