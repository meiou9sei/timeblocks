import { useState, useEffect, useRef } from 'react'

const ORIGINAL_TITLE = document.title

function requestNotifyPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function startAlarm(titleFlashRef) {
  // OS notification (works when tabbed away)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ Timer Done!', {
      body: 'Your Pomodoro session is complete.',
      icon: '/favicon.ico',
      requireInteraction: true,
    })
  }

  // Tab title flashing
  let on = true
  titleFlashRef.current = setInterval(() => {
    document.title = on ? '⏰ TIME\'S UP!' : ORIGINAL_TITLE
    on = !on
  }, 800)
}

function stopAlarm(titleFlashRef) {
  clearInterval(titleFlashRef.current)
  titleFlashRef.current = null
  document.title = ORIGINAL_TITLE
}

export default function PomodoroTimer({ minutes = 25, onProgress }) {
  const DURATION = minutes * 60
  const [phase, setPhase]         = useState('idle')    // 'idle' | 'running' | 'ringing'
  const [remaining, setRemaining] = useState(() => minutes * 60)
  const intervalRef    = useRef(null)
  const titleFlashRef  = useRef(null)

  const progress = (DURATION - remaining) / DURATION
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')

  // Notify parent of phase/progress changes for page fill effect
  useEffect(() => {
    onProgress?.(phase, progress)
  }, [phase, progress]) // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    requestNotifyPermission()
    setPhase('running')
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setPhase('ringing')
          startAlarm(titleFlashRef)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function cancel() {
    clearInterval(intervalRef.current)
    setPhase('idle')
    setRemaining(DURATION)
  }

  function dismiss() {
    stopAlarm(titleFlashRef)
    setPhase('idle')
    setRemaining(DURATION)
  }

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current)
    stopAlarm(titleFlashRef)
  }, [])

  // Reset when duration setting changes (only while idle)
  useEffect(() => {
    if (phase === 'idle') setRemaining(minutes * 60)
  }, [minutes])

  return (
    <div className={`pomo${phase === 'ringing' ? ' pomo--ringing' : ''}`}>
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
          style={{ height: `${progress * 100}%` }}
        />
        {phase === 'ringing' && <div className="pomo-full-flash" />}
      </div>

      <div className={`pomo-time${phase === 'ringing' ? ' pomo-time--alert' : ''}`}>
        {phase === 'ringing' ? 'DONE' : `${mins}:${secs}`}
      </div>

      {phase === 'idle' && (
        <button className="pomo-btn" onClick={start} title="Start 25-minute timer">
          ▶
        </button>
      )}
      {phase === 'running' && (
        <button className="pomo-btn pomo-btn--stop" onClick={cancel} title="Cancel timer">
          ■
        </button>
      )}
      {phase === 'ringing' && (
        <button className="pomo-btn pomo-btn--dismiss" onClick={dismiss} title="Dismiss alarm">
          ✕
        </button>
      )}
    </div>
  )
}
