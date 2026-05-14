import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyC7u8IjZUFPmlKul103R8GCoxruMEQHhw0',
  authDomain: 'timeblocks-e9407.firebaseapp.com',
  projectId: 'timeblocks-e9407',
  storageBucket: 'timeblocks-e9407.firebasestorage.app',
  messagingSenderId: '976922145557',
  appId: '1:976922145557:web:a6adb1426d59bd1563af1c',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
