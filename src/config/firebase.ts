import { initializeApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id",
  databaseURL: "https://demo-project-default-rtdb.firebaseio.com"
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