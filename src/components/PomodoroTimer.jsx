import { useState, useEffect, useRef } from 'react'

function startAlarm(audioCtxRef, alarmRef) {
  const ctx = new AudioContext()
  audioCtxRef.current = ctx

  function beep() {
    if (!audioCtxRef.current) return
    const now = ctx.currentTime

    // Two-tone alarm: hi-lo pattern
    ;[0, 0.18].forEach((offset, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.value = i === 0 ? 880 : 660
      gain.gain.setValueAtTime(0, now + offset)
      gain.gain.linearRampToValueAtTime(0.12, now + offset + 0.02)
      gain.gain.setValueAtTime(0.12, now + offset + 0.13)
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.16)
      osc.start(now + offset)
      osc.stop(now + offset + 0.18)
    })
  }

  beep()
  alarmRef.current = setInterval(beep, 900)
}

function stopAlarm(audioCtxRef, alarmRef) {
  clearInterval(alarmRef.current)
  alarmRef.current = null
  audioCtxRef.current?.close()
  audioCtxRef.current = null
}

export default function PomodoroTimer({ minutes = 25 }) {
  const DURATION = minutes * 60
  const [phase, setPhase]         = useState('idle')    // 'idle' | 'running' | 'ringing'
  const [remaining, setRemaining] = useState(() => minutes * 60)
  const intervalRef  = useRef(null)
  const audioCtxRef  = useRef(null)
  const alarmRef     = useRef(null)

  const progress = (DURATION - remaining) / DURATION
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')

  function start() {
    setPhase('running')
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setPhase('ringing')
          startAlarm(audioCtxRef, alarmRef)
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
    stopAlarm(audioCtxRef, alarmRef)
    setPhase('idle')
    setRemaining(DURATION)
  }

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current)
    stopAlarm(audioCtxRef, alarmRef)
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
