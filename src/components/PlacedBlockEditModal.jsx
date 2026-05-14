import { useState, useEffect } from 'react'

function formatDuration(slots) {
  const h = Math.floor(slots / 2)
  const m = (slots % 2) * 30
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

const TETRIS_COLORS = [
  '#00e5ff',
  '#f9e040',
  '#a855f7',
  '#f97316',
  '#3b82f6',
  '#4ade80',
  '#ef4444',
  '#ec4899',
  '#f1f1f1',
]

function isLight(hex) {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 115
}

export default function PlacedBlockEditModal({ block, placedId, track, placedDuration, maxDuration, onSave, onRemove, onClose }) {
  const [name,        setName]        = useState(block.name)
  const [color,       setColor]       = useState(block.color)
  const [customColor, setCustomColor] = useState(block.color)
  const [description, setDescription] = useState(block.description ?? '')
  const [duration,    setDuration]    = useState(placedDuration ?? block.duration ?? 2)
  const [hitMax,      setHitMax]      = useState(false)

  const maxSlots = maxDuration ?? 48

  function changeDuration(newDuration) {
    if (newDuration > maxSlots) {
      setHitMax(true)
    } else {
      setHitMax(false)
      setDuration(Math.max(1, newDuration))
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [name, color, description, duration])

  function handleSave() {
    if (!name.trim()) return
    onSave(block.id, { name: name.trim(), color, description, duration })
    onClose()
  }

  function handleRemove() {
    onRemove(placedId, track)
    onClose()
  }

  const light = isLight(color)

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pbe-modal">
        <div className="pbe-header">
          <span className="pbe-title">Edit Block</span>
          <button className="settings-modal-close" onClick={onClose}>✕</button>
        </div>

        <input
          className="create-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Block name"
          autoFocus
        />

        <textarea
          className="create-input pbe-desc"
          placeholder="Optional note…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={1000}
        />

        <div className="color-grid">
          {TETRIS_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`color-swatch${color === c ? ' color-swatch--active' : ''}`}
              style={{ background: c }}
              onClick={() => { setColor(c); setCustomColor(c) }}
            />
          ))}
          <div className="color-custom-wrap">
            <input
              type="color"
              className="color-custom"
              value={customColor}
              onChange={e => { setCustomColor(e.target.value); setColor(e.target.value) }}
            />
            <svg className="color-custom-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.5 2a1 1 0 0 1 .707.293l3.5 3.5a1 1 0 0 1 0 1.414l-8 8A1 1 0 0 1 9 15.5H5.5a1 1 0 0 1-1-1V11a1 1 0 0 1 .293-.707l8-8A1 1 0 0 1 13.5 2zm0 2.414L6 11.914V13.5h1.586l7.5-7.5L13.5 4.414zM3 17.5a.5.5 0 0 1 0-1h14a.5.5 0 0 1 0 1H3z"/>
            </svg>
          </div>
        </div>

        <div
          className="color-preview"
          style={{ background: color, color: light ? '#111' : '#fff' }}
        >
          {name || 'Preview'}
        </div>

        {(placedId === null || placedDuration != null) && (<>
          <div className="duration-stepper">
            <button
              type="button"
              className="duration-step-btn"
              onClick={() => changeDuration(duration - 1)}
            >−</button>
            <div className="duration-input-wrap">
              <input
                type="number"
                className="duration-input"
                value={duration / 2}
                min={0.5}
                max={maxSlots / 2}
                step={0.5}
                onChange={e => {
                  const slots = Math.round(parseFloat(e.target.value) * 2)
                  if (!isNaN(slots)) changeDuration(slots)
                }}
              />
              <span className="duration-unit">hr</span>
            </div>
            <button
              type="button"
              className="duration-step-btn"
              onClick={() => changeDuration(duration + 1)}
            >+</button>
            <span className="duration-label">{formatDuration(duration)}</span>
          </div>
          {hitMax && placedDuration != null && (
            <p className="duration-no-space">No space to extend</p>
          )}
        </>)}

        <div className="pbe-actions">
          <button className="pbe-remove-btn" onClick={handleRemove}>Remove</button>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="palette-edit-cancel" onClick={onClose}>Cancel</button>
            <button className="create-btn" onClick={handleSave} disabled={!name.trim()}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
