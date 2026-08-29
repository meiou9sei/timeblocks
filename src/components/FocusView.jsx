import { useEffect, useMemo, useState } from 'react'
import PomodoroTimer from './PomodoroTimer.jsx'

function isLight(hex) {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 115
}

function formatTime(slot, fmt) {
  const h24 = Math.floor(slot / 2)
  const mins = (slot % 2) * 30
  if (fmt === '24h') {
    return mins === 0 ? `${String(h24).padStart(2, '0')}:00` : `${String(h24).padStart(2, '0')}:30`
  }
  const h12 = h24 % 12 || 12
  const ampm = h24 < 12 ? 'AM' : 'PM'
  return mins === 0 ? `${h12} ${ampm}` : `${h12}:30`
}

function currentSlot() {
  const now = new Date()
  return Math.floor((now.getHours() * 60 + now.getMinutes()) / 30)
}

function FocusMessage({ message, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message)

  useEffect(() => {
    if (!editing) setDraft(message)
  }, [message, editing])

  function commit() {
    onChange(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="text"
        className="focus-message-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(message); setEditing(false) }
        }}
        placeholder="Add a motivational note..."
        maxLength={140}
        autoFocus
      />
    )
  }

  return (
    <p className="focus-message" onClick={() => setEditing(true)} title="Click to edit">
      {message.trim() || 'Click to add a motivational note...'}
    </p>
  )
}

export default function FocusView({ ideal, actual, getBlock, settings, pomo, message, onMessageChange }) {
  const [nowSlot, setNowSlot] = useState(currentSlot)

  useEffect(() => {
    const id = setInterval(() => setNowSlot(currentSlot()), 15000)
    return () => clearInterval(id)
  }, [])

  const current = useMemo(() => {
    const findAt = (arr) => arr.find(p => nowSlot >= p.startSlot && nowSlot < p.startSlot + p.duration)
    return findAt(actual) ?? findAt(ideal) ?? null
  }, [actual, ideal, nowSlot])

  const block = current ? getBlock(current.blockId) : null
  const fmt = settings.timeFormat ?? '12h'

  if (!block) {
    return (
      <div className="focus-view focus-view--empty">
        <div className="focus-content">
          <p className="focus-empty-text">Nothing scheduled right now.</p>
        </div>
        <div className="focus-pomo-wrap">
          <PomodoroTimer
            horizontal
            phase={pomo.phase}
            remaining={pomo.remaining}
            minutes={settings.pomodoroMinutes ?? 25}
            onStart={pomo.start}
            onCancel={pomo.cancel}
            onDismiss={pomo.dismiss}
          />
        </div>
        <FocusMessage message={message} onChange={onMessageChange} />
      </div>
    )
  }

  const light = isLight(block.color)

  return (
    <div className="focus-view" style={{ background: block.color, color: light ? '#111' : '#fff' }}>
      <div className="focus-content">
        <div className="focus-time">
          {formatTime(current.startSlot, fmt)} – {formatTime(current.startSlot + current.duration, fmt)}
        </div>
        <div className="focus-name">{block.name}</div>
        {block.description && <p className="focus-desc">{block.description}</p>}
      </div>
      <div className="focus-pomo-wrap">
        <PomodoroTimer
          horizontal
          phase={pomo.phase}
          remaining={pomo.remaining}
          minutes={settings.pomodoroMinutes ?? 25}
          onStart={pomo.start}
          onCancel={pomo.cancel}
          onDismiss={pomo.dismiss}
        />
      </div>
      <FocusMessage message={message} onChange={onMessageChange} />
    </div>
  )
}
