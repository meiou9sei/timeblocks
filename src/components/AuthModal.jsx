import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase.js'

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

  function friendlyError(code) {
    switch (code) {
      case 'auth/invalid-email':            return 'Invalid email address.'
      case 'auth/user-not-found':           return 'No account found with that email.'
      case 'auth/wrong-password':           return 'Incorrect password.'
      case 'auth/invalid-credential':       return 'Incorrect email or password.'
      case 'auth/email-already-in-use':     return 'An account with this email already exists.'
      case 'auth/weak-password':            return 'Password must be at least 6 characters.'
      case 'auth/too-many-requests':        return 'Too many attempts. Try again later.'
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
      </div>
    </div>
  )
}
