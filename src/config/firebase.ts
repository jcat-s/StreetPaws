import { initializeApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAPCesU9DOiBncQWXsxB54nsEFT1iTTA_Y",
  authDomain: "streetpaws-7b8c4.firebaseapp.com",
  projectId: "streetpaws-7b8c4",
  storageBucket: "streetpaws-7b8c4.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  databaseURL: "https://streetpaws-7b8c4-default-rtdb.firebaseio.com"
}

// Initialize Firebase with error handling
let app: any = null
let auth: Auth | null = null

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
} catch (error) {
  console.warn('Firebase initialization failed:', error)
}

export { auth }
export default app 