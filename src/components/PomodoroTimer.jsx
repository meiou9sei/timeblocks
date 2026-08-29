export default function PomodoroTimer({ phase, remaining, minutes = 25, onStart, onCancel, onDismiss, horizontal = false }) {
  const DURATION = minutes * 60
  const progress = (DURATION - remaining) / DURATION
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')

  return (
    <div className={`pomo${horizontal ? ' pomo--horizontal' : ''}${phase === 'ringing' ? ' pomo--ringing' : ''}`}>
      <div className="pomo-label">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {/* stem */}
          <path d="M12 3 C12 3 11 5 11 6.5 L13 6.5 C13 5 12 3 12 3Z" />
          {/* leaves */}
          <path d="M11.5 6 C9 4.5 6.5 6 7.5 8 C9.5 7 11 6.5 11.5 6Z" />
          <path d="M12.5 6 C15 4.5 17.5 6 16.5 8 C14.5 7 13 6.5 12.5 6Z" />
          {/* body — wide and squat */}
          <ellipse cx="12" cy="14.5" rx="8.5" ry="6" />
        </svg>
      </div>

      <div className="pomo-bar-wrap">
        <div
          className="pomo-fill"
          style={horizontal ? { width: `${progress * 100}%` } : { height: `${progress * 100}%` }}
        />
        {phase === 'ringing' && <div className="pomo-full-flash" />}
      </div>

      <div className={`pomo-time${phase === 'ringing' ? ' pomo-time--alert' : ''}`}>
        {phase === 'ringing' ? 'DONE' : `${mins}:${secs}`}
      </div>

      {phase === 'idle' && (
        <button className="pomo-btn" onClick={onStart} title={`Start ${minutes}-minute timer`}>
          ▶
        </button>
      )}
      {phase === 'running' && (
        <button className="pomo-btn pomo-btn--stop" onClick={onCancel} title="Cancel timer">
          ■
        </button>
      )}
      {phase === 'ringing' && (
        <button className="pomo-btn pomo-btn--dismiss" onClick={onDismiss} title="Dismiss alarm">
          ✕
        </button>
      )}
    </div>
  )
}
