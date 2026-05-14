import { useState, useRef, useEffect } from 'react'
import PlacedBlockEditModal from './PlacedBlockEditModal.jsx'

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

const DURATIONS = [
  { value: 1,  label: '30 min' },
  { value: 2,  label: '1 hr' },
  { value: 3,  label: '1.5 hr' },
  { value: 4,  label: '2 hr' },
  { value: 6,  label: '3 hr' },
  { value: 8,  label: '4 hr' },
  { value: 12, label: '6 hr' },
  { value: 16, label: '8 hr' },
]

function formatDuration(slots) {
  const h = Math.floor(slots / 2)
  const m = (slots % 2) * 30
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function isLight(hex) {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 115
}

const PROCRAST_LIMIT = 3

export default function MobileBlockBar({ blocks, procrastTasks = [], onAddBlock, noDragMode, picking, onPick, onEditBlock, onRemoveBlock }) {
  const [showPanel, setShowPanel] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(TETRIS_COLORS[0])
  const [duration, setDuration] = useState(2)
  const [customColor, setCustomColor] = useState('#00e5ff')
  const [shownProcrastIds, setShownProcrastIds] = useState([])
  const lastTapRef = useRef(null) // { blockId }

  function pickRandom(tasks) {
    return [...tasks].sort(() => Math.random() - 0.5).slice(0, PROCRAST_LIMIT).map(t => t.id)
  }

  // Keep shown IDs valid as tasks are added/removed; fill gaps with random picks
  useEffect(() => {
    const pending = procrastTasks.filter(t => !t.done)
    const pendingIds = new Set(pending.map(t => t.id))
    setShownProcrastIds(prev => {
      const valid = prev.filter(id => pendingIds.has(id))
      if (valid.length >= Math.min(PROCRAST_LIMIT, pending.length)) return valid.slice(0, PROCRAST_LIMIT)
      const remaining = pending.filter(t => !valid.includes(t.id))
      const extra = [...remaining].sort(() => Math.random() - 0.5).slice(0, PROCRAST_LIMIT - valid.length)
      return [...valid, ...extra.map(t => t.id)]
    })
  }, [procrastTasks])

  useEffect(() => {
    if (!picking) lastTapRef.current = null
  }, [picking])

  const visibleBlocks = blocks.filter(b => !b.procrast && !b.deleted && !b.paletteHidden)
  const pendingProcrast = procrastTasks.filter(t => !t.done)
  const shownProcrast = shownProcrastIds
    .map(id => pendingProcrast.find(t => t.id === id))
    .filter(Boolean)
  const hasMoreProcrast = pendingProcrast.length > PROCRAST_LIMIT

  function handleProcrastTileClick(task) {
    const isPicking = picking?.procrastTaskId === task.id
    onPick(isPicking ? null : { procrastTaskId: task.id, taskText: task.text, duration: 2 })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAddBlock({ name: name.trim(), color, duration, description: '' })
    setName('')
    setShowPanel(false)
  }

  function handleTileClick(block) {
    const last = lastTapRef.current
    if (last && last.blockId === block.id) {
      lastTapRef.current = null
      onPick(null)
      setEditingBlock(block)
      return
    }
    lastTapRef.current = { blockId: block.id }
    const isPicking = picking?.blockId === block.id
    onPick(isPicking ? null : { blockId: block.id, duration: block.duration })
  }

  return (
    <>
      {editingBlock && (
        <PlacedBlockEditModal
          block={editingBlock}
          placedId={null}
          onSave={(blockId, updates) => { onEditBlock(blockId, updates); setEditingBlock(null) }}
          onRemove={() => { onRemoveBlock(editingBlock.id); setEditingBlock(null) }}
          onClose={() => setEditingBlock(null)}
        />
      )}

      {showPanel && (
        <div className="mobile-new-block-panel">
          <div className="mobile-new-block-panel-header">
            <span className="mobile-new-block-panel-title">NEW BLOCK</span>
            <button className="mobile-new-block-panel-close" onClick={() => setShowPanel(false)}>✕</button>
          </div>
          <form className="mobile-new-block-form" onSubmit={handleSubmit}>
            <input
              className="create-input"
              placeholder="Block name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              autoFocus
            />
            <select
              className="create-select"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <div className="color-preview" style={{ background: color, color: isLight(color) ? '#111' : '#fff' }}>
              {name || 'Preview'}
            </div>
            <div className="color-grid">
              {TETRIS_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'color-swatch--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <div className="color-custom-wrap">
                <input
                  type="color"
                  className="color-custom"
                  value={customColor}
                  onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value) }}
                />
                <svg className="color-custom-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 2a1 1 0 0 1 .707.293l3.5 3.5a1 1 0 0 1 0 1.414l-8 8A1 1 0 0 1 9 15.5H5.5a1 1 0 0 1-1-1V11a1 1 0 0 1 .293-.707l8-8A1 1 0 0 1 13.5 2zm0 2.414L6 11.914V13.5h1.586l7.5-7.5L13.5 4.414zM3 17.5a.5.5 0 0 1 0-1h14a.5.5 0 0 1 0 1H3z"/>
                </svg>
              </div>
            </div>
            <button type="submit" className="create-btn">+ ADD BLOCK</button>
          </form>
        </div>
      )}

      <div className="mobile-block-bar">
        <div className="mobile-block-scroll">
          {visibleBlocks.length === 0 && (
            <span className="mobile-block-empty">No blocks yet</span>
          )}
          {visibleBlocks.map(block => {
            const light = isLight(block.color)
            const isPicking = picking?.blockId === block.id
            return (
              <button
                key={block.id}
                type="button"
                className={`mobile-block-tile${isPicking ? ' mobile-block-tile--picking' : ''}`}
                style={{ background: block.color, color: light ? '#111' : '#fff', '--glow': block.color }}
                onClick={() => handleTileClick(block)}
              >
                <span className="mobile-block-tile-name">{block.name}</span>
                <span className="mobile-block-tile-dur">{formatDuration(block.duration)}</span>
              </button>
            )
          })}
          {pendingProcrast.length > 0 && (
            <>
              <div className="mobile-bar-divider" />
              {shownProcrast.map(task => {
                const isPicking = picking?.procrastTaskId === task.id
                return (
                  <button
                    key={task.id}
                    type="button"
                    className={`mobile-block-tile mobile-block-tile--procrast${isPicking ? ' mobile-block-tile--picking' : ''}`}
                    style={{ background: '#c87d2f', color: '#fff', '--glow': '#c87d2f' }}
                    onClick={() => handleProcrastTileClick(task)}
                  >
                    <span className="mobile-block-tile-procrast-icon">🍺</span>
                    <span className="mobile-block-tile-name">{task.text}</span>
                  </button>
                )
              })}
              {hasMoreProcrast && (
                <button
                  type="button"
                  className="mobile-procrast-overflow"
                  onClick={() => setShownProcrastIds(pickRandom(pendingProcrast))}
                >
                  <span className="mobile-procrast-overflow-icon">↻</span>
                  <span className="mobile-procrast-overflow-label">shake it up</span>
                </button>
              )}
            </>
          )}
        </div>
        <button
          className={`mobile-new-block-btn${showPanel ? ' mobile-new-block-btn--open' : ''}`}
          onClick={() => setShowPanel(p => !p)}
          aria-label="New block"
        >
          {showPanel ? '✕' : '+'}
        </button>
      </div>
    </>
  )
}
