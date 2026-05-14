import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'

export default function AuthModal({ onClose }) {
  const [tab,      setTab]      = useState('signin') // 'signin' | 'signup'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      onClose()
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      onClose()
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  function friendlyError(code) {
    switch (code) {
      case 'auth/invalid-email':            return 'Invalid email address.'
      case 'auth/user-not-found':           return 'No account found with that email.'
      case 'auth/wrong-password':           return 'Incorrect password.'
      case 'auth/invalid-credential':       return 'Incorrect email or password.'
      case 'auth/email-already-in-use':     return 'An account with this email already exists.'
      case 'auth/weak-password':            return 'Password must be at least 6 characters.'
      case 'auth/too-many-requests':        return 'Too many attempts. Try again later.'
      case 'auth/popup-closed-by-user':        return 'Sign-in was cancelled.'
      case 'auth/popup-blocked':               return 'Pop-up was blocked by the browser. Please allow pop-ups and try again.'
      default:                              return 'Something went wrong. Please try again.'
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <div className="settings-modal-header">
          <div className="auth-modal-tabs">
            <button
              className={`auth-tab${tab === 'signin' ? ' auth-tab--active' : ''}`}
              onClick={() => { setTab('signin'); setError('') }}
            >Sign In</button>
            <button
              className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`}
              onClick={() => { setTab('signup'); setError('') }}
            >Sign Up</button>
          </div>
          <button className="settings-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="auth-modal-form" onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <input
              className="create-input"
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e) } }}
            />
          )}
          <input
            className="create-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e) } }}
          />
          <input
            className="create-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e) } }}
          />
          {error && <p className="auth-modal-error">{error}</p>}
          <button className="create-btn" type="submit" disabled={loading} tabIndex={0}>
            {loading ? 'Please wait…' : tab === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="auth-google-btn" onClick={handleGoogleSignIn} disabled={loading} type="button">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}
