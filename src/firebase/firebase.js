//  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { initializeApp } from 'firebase/app';
import { getFirestore} from 'firebase/firestore'; //"https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
      apiKey: "AIzaSyCD7bZfS0W5uneddwLrICSNcOmszPwvqPQ",
      authDomain: "duque-cc539.firebaseapp.com",
      projectId: "duque-cc539",
      storageBucket: "duque-cc539.firebasestorage.app",
      messagingSenderId: "628155015698",
      appId: "1:628155015698:web:325e0fa80fc36097e8eecb"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);