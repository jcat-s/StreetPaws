import { initializeApp } from 'firebase/app'
import { getAuth, Auth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth'
import type { Analytics } from 'firebase/analytics'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const requiredEnv = [
	'VITE_FIREBASE_API_KEY',
	'VITE_FIREBASE_AUTH_DOMAIN',
	'VITE_FIREBASE_PROJECT_ID',
	'VITE_FIREBASE_STORAGE_BUCKET',
	'VITE_FIREBASE_MESSAGING_SENDER_ID',
	'VITE_FIREBASE_APP_ID'
]

function getConfig() {
	const missing = requiredEnv.filter((key) => !import.meta.env[key as keyof ImportMetaEnv])
	const hasAll = missing.length === 0
	if (hasAll) {
		return {
			apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
			authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
			projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
			storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
			messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
			appId: import.meta.env.VITE_FIREBASE_APP_ID,
			measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
			databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
		}
	}
	// Fall back to a single, consistent config to avoid mixed-project keys
	if (!hasAll) {
		console.warn(
			`Missing Firebase env vars: ${missing.join(', ')}. Using fallback config for project ${fallbackConfig.projectId}. ` +
			'Add a .env to target a different project.'
		)
	}
	return fallbackConfig
}

// Fallback config (from your provided values) used only if env vars are missing
const fallbackConfig = {
	apiKey: 'AIzaSyAPCesU9DOiBncQWXsxB54nsEFT1iTTA_Y',
	authDomain: 'streetpaws2.firebaseapp.com',
	projectId: 'streetpaws2',
	// Use the correct storage bucket domain format
	storageBucket: 'streetpaws2.appspot.com',
	messagingSenderId: '1098495990738',
	appId: '1:1098495990738:web:70a9c8cd27978c7843c60b',
	measurementId: 'G-1QDL9D3LVV'
}

const firebaseConfig = getConfig()

// Initialize Firebase with error handling
let app: any = null
let auth: Auth | null = null
let analytics: Analytics | null = null
let db: ReturnType<typeof getFirestore> | null = null

try {
	app = initializeApp(firebaseConfig)
	auth = getAuth(app)
    db = getFirestore(app)
	console.info('[Firebase]', 'projectId =', (firebaseConfig as any)?.projectId)
	if (typeof window !== 'undefined') {
		isSupported()
			.then((supported: boolean) => {
				if (supported) {
					analytics = getAnalytics(app)
				}
			})
			.catch(() => {})
	}
} catch (error) {
	console.warn('Firebase initialization failed:', error)
}

// Initialize social auth providers
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()
const appleProvider = new OAuthProvider('apple.com')

// Configure providers
googleProvider.addScope('email')
googleProvider.addScope('profile')

facebookProvider.addScope('email')
facebookProvider.addScope('public_profile')

appleProvider.addScope('email')
appleProvider.addScope('name')

export { auth, analytics, db, googleProvider, facebookProvider, appleProvider }
export default app