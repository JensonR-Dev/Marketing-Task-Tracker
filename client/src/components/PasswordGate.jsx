import { useState } from 'react'
import { api } from '../api.js'

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError('')
    try {
      await api.login(password)
      localStorage.setItem('tracker-key', password)
      onUnlock()
    } catch {
      setError('Wrong password. Ask your team for the shared password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-screen">
      <form className="name-picker password-gate" onSubmit={submit}>
        <div className="gate-icon">🔒</div>
        <h1>Marketing Task Dashboard</h1>
        <p>This tracker is for the marketing team. Enter the team password to continue.</p>
        <input
          type="password"
          className="modal-input"
          placeholder="Team password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p className="gate-error">{error}</p>}
        <button className="btn btn-primary gate-btn" disabled={!password || busy}>
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
