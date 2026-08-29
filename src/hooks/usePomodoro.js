import { useState, useRef, useEffect, useCallback } from 'react'

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

// Owns the actual countdown so it keeps running regardless of which view
// (if any) is currently rendering a <PomodoroTimer/> for it.
export function usePomodoro(minutes) {
  const DURATION = minutes * 60
  const [phase, setPhase]         = useState('idle')
  const [remaining, setRemaining] = useState(DURATION)
  const intervalRef   = useRef(null)
  const titleFlashRef = useRef(null)

  const start = useCallback(() => {
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
  }, [])

  const cancel = useCallback(() => {
    clearInterval(intervalRef.current)
    setPhase('idle')
    setRemaining(DURATION)
  }, [DURATION])

  const dismiss = useCallback(() => {
    stopAlarm(titleFlashRef)
    setPhase('idle')
    setRemaining(DURATION)
  }, [DURATION])

  // Cleanup only on true app teardown (page close/reload)
  useEffect(() => () => {
    clearInterval(intervalRef.current)
    stopAlarm(titleFlashRef)
  }, [])

  // Reset when the duration setting changes (only while idle)
  useEffect(() => {
    if (phase === 'idle') setRemaining(DURATION)
  }, [DURATION]) // eslint-disable-line react-hooks/exhaustive-deps

  const progress = (DURATION - remaining) / DURATION

  return { phase, remaining, progress, start, cancel, dismiss }
}
