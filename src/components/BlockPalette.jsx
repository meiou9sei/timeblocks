import { useState, useRef } from 'react'
import PlacedBlockEditModal from './PlacedBlockEditModal.jsx'

const QUOTES = [
  { text: 'Either you run the day or the day runs you.',                                       author: 'Jim Rohn' },
  { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: 'Stephen Covey' },
  { text: 'Lost time is never found again.',                                                    author: 'Benjamin Franklin' },
  { text: 'Time is what we want most, but what we use worst.',                                 author: 'William Penn' },
  { text: 'Until we can manage time, we can manage nothing else.',                             author: 'Peter Drucker' },
  { text: "It's not enough to be busy. The question is: what are we busy about?",             author: 'Henry David Thoreau' },
  { text: "Time flies, but you're the pilot.",                                                 author: 'Michael Altshuler' },
  { text: 'Plan your work and work your plan.',                                                author: 'Napoleon Hill' },
  { text: 'A goal without a plan is just a wish.',                                             author: 'Antoine de Saint-Exupéry' },
  { text: 'You may delay, but time will not.',                                                 author: 'Benjamin Franklin' },
]

const TETRIS_COLORS = [
  '#00e5ff', // cyan   (I)
  '#f9e040', // yellow (O)
  '#a855f7', // purple (T)
  '#f97316', // orange (L)
  '#3b82f6', // blue   (J)
  '#4ade80', // green  (S)
  '#ef4444', // red    (Z)
  '#ec4899', // pink
  '#f1f1f1', // white
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

export default function BlockPalette({ blocks, settings = {}, onDragStart, onDragEnd, onAddBlock, onEditBlock, onRemoveBlock, onReorderBlocks, noDragMode, picking, onPick, onAddDistraction, onOpenDistractions, mvp, onMvpTextChange, onMvpToggle, starredGoals = [], onAdhocDragStart, onAdhocPick }) {
  const [name,        setName]        = useState('')
  const [color,       setColor]       = useState(TETRIS_COLORS[0])
  const [duration,    setDuration]    = useState(2)
  const [customColor, setCustomColor] = useState('#00e5ff')
  const [editingBlock, setEditingBlock] = useState(null)
  const [dragOverId,  setDragOverId]  = useState(null)
  const [distraction, setDistraction] = useState('')
  const [distrAdded,  setDistrAdded]  = useState(false)
  const [paletteTab,  setPaletteTab]  = useState('distractions') // 'mvp' | 'distractions' | 'goals'
  const reorderingId = useRef(null)
  const quote = useRef(QUOTES[Math.floor(Math.random() * QUOTES.length)]).current

  function handleAdhocClick(taskText) {
    if (noDragMode) onAdhocPick(taskText)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAddBlock({ name: name.trim(), color, duration, description: '' })
    setName('')
  }

  function handleAddDistraction(e) {
    e.preventDefault()
    if (!distraction.trim()) return
    onAddDistraction(distraction.trim())
    setDistraction('')
    setDistrAdded(true)
    setTimeout(() => setDistrAdded(false), 2000)
  }

  return (
    <div className="block-palette">
      <div className="palette-section-title">BLOCKS</div>

      <div className="palette-blocks">
        {blocks.length === 0 && (
          <p className="palette-empty">No blocks yet. Create one below.</p>
        )}
        {blocks.filter(b => !b.deleted && !b.paletteHidden).map(block => {
          const light = isLight(block.color)
          return (
            <div
              key={block.id}
              className={[
                'palette-block',
                dragOverId === block.id ? 'palette-block--drop-target' : '',
                noDragMode && picking?.blockId === block.id ? 'palette-block--picking' : '',
              ].join(' ')}
              style={{
                background: block.color,
                color: light ? '#111' : '#fff',
                '--glow': block.color,
              }}
              draggable={!noDragMode}
              onClick={() => {
                if (noDragMode) {
                  onPick(picking?.blockId === block.id ? null : { blockId: block.id, duration: block.duration })
                  return
                }
                setEditingBlock(block)
              }}
              onDragStart={(e) => {
                e.stopPropagation()
                if (reorderingId.current) {
                  e.dataTransfer.effectAllowed = 'move'
                } else {
                  onDragStart({ source: 'palette', blockId: block.id })
                }
              }}
              onDragOver={(e) => {
                if (reorderingId.current) {
                  e.preventDefault()
                  setDragOverId(block.id)
                }
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => {
                if (reorderingId.current) {
                  e.preventDefault()
                  onReorderBlocks(reorderingId.current, block.id)
                  reorderingId.current = null
                  setDragOverId(null)
                }
              }}
              onDragEnd={() => {
                reorderingId.current = null
                setDragOverId(null)
                onDragEnd()
              }}
            >
              <div
                className="palette-block-handle"
                style={{ color: light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}
                onMouseDown={() => { reorderingId.current = block.id }}
              >⠿</div>
              <div className="palette-block-body">
                <div className="palette-block-name">{block.name}</div>
                <div className="palette-block-dur">{formatDuration(block.duration)}</div>
                {block.description && (
                  <div className="palette-block-desc">{block.description}</div>
                )}
              </div>
              <div className="palette-block-actions">
                <button
                  className="palette-block-remove"
                  style={{ color: light ? '#111' : '#fff' }}
                  onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id) }}
                  title="Delete block"
                >×</button>
                <button
                  className="palette-block-edit"
                  style={{ color: light ? '#111' : '#fff' }}
                  onClick={(e) => { e.stopPropagation(); setEditingBlock(block) }}
                  title="Edit block"
                >✎</button>
              </div>
            </div>
          )
        })}
      </div>

      {editingBlock && (
        <PlacedBlockEditModal
          block={editingBlock}
          placedId={null}
          track={null}
          onSave={(blockId, updates) => onEditBlock(blockId, updates)}
          onRemove={() => onRemoveBlock(editingBlock.id)}
          onClose={() => setEditingBlock(null)}
        />
      )}

      {settings.showSomedayMaybe !== false && (
        <div className="palette-procrast">
          <div className="palette-tabs">
            <button
              className={`palette-tab${paletteTab === 'mvp' ? ' palette-tab--active' : ''}`}
              onClick={() => setPaletteTab('mvp')}
            >TODAY'S MVP</button>
            <button
              className={`palette-tab${paletteTab === 'distractions' ? ' palette-tab--active' : ''}`}
              onClick={() => setPaletteTab('distractions')}
            >DISTRACTIONS</button>
            <button
              className={`palette-tab${paletteTab === 'goals' ? ' palette-tab--active' : ''}`}
              onClick={() => setPaletteTab('goals')}
            >GOALS</button>
          </div>

          {paletteTab === 'mvp' && (
            <div className="palette-mvp">
              <p className="palette-mvp-sub">3 things you must get done today, no matter what.</p>
              {mvp.goals.map((goal, i) => (
                <label key={i} className={`mvp-goal${goal.done ? ' mvp-goal--done' : ''}`}>
                  <input
                    type="checkbox"
                    className="mvp-goal-check"
                    checked={goal.done}
                    onChange={() => onMvpToggle(i)}
                  />
                  <input
                    type="text"
                    className="mvp-goal-input"
                    placeholder={`Goal ${i + 1}...`}
                    value={goal.text}
                    onChange={(e) => onMvpTextChange(i, e.target.value)}
                    maxLength={80}
                  />
                  {goal.text.trim() && (
                    <button
                      type="button"
                      className={`mvp-goal-drag${noDragMode && picking?.adhocText === goal.text ? ' mvp-goal-drag--picking' : ''}`}
                      draggable={!noDragMode}
                      onDragStart={(e) => { e.stopPropagation(); onAdhocDragStart(goal.text) }}
                      onDragEnd={onDragEnd}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdhocClick(goal.text) }}
                      title="Drag onto the schedule"
                    >⠿</button>
                  )}
                </label>
              ))}
            </div>
          )}

          {paletteTab === 'goals' && (
            <div className="palette-goals">
              {starredGoals.length === 0 ? (
                <p className="palette-goals-none">No starred subgoals yet. Star one in The Tree tab to see it here.</p>
              ) : (
                starredGoals.map(g => (
                  <div
                    key={g.id}
                    className={`palette-goal-item${noDragMode && picking?.adhocText === g.text ? ' palette-goal-item--picking' : ''}`}
                    draggable={!noDragMode}
                    onDragStart={() => onAdhocDragStart(g.text)}
                    onDragEnd={onDragEnd}
                    onClick={() => handleAdhocClick(g.text)}
                  >
                    <span className="palette-goal-text">{g.text}</span>
                    <span className="palette-goal-tree">{g.treeName}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {paletteTab === 'distractions' && (
            <div className="palette-distractions">
              <form className="palette-distr-form" onSubmit={handleAddDistraction}>
                <div className="distraction-input-row">
                  <input
                    className="create-input distraction-input"
                    placeholder="What's on your mind..."
                    value={distraction}
                    onChange={(e) => setDistraction(e.target.value)}
                    maxLength={2000}
                  />
                  <button type="submit" className="distraction-add-btn" disabled={!distraction.trim()}>
                    {distrAdded ? '✓' : '+'}
                  </button>
                </div>
              </form>
              <button type="button" className="distraction-view-btn" onClick={onOpenDistractions}>
                view all in Brain Dump →
              </button>
            </div>
          )}
        </div>
      )}

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="create-form-title">NEW BLOCK</div>

        <input
          className="create-input"
          placeholder="Block name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
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
              title={c}
            />
          ))}
          <div className="color-custom-wrap">
            <input
              type="color"
              className="color-custom"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value) }}
              title="Custom color"
            />
            <svg className="color-custom-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.5 2a1 1 0 0 1 .707.293l3.5 3.5a1 1 0 0 1 0 1.414l-8 8A1 1 0 0 1 9 15.5H5.5a1 1 0 0 1-1-1V11a1 1 0 0 1 .293-.707l8-8A1 1 0 0 1 13.5 2zm0 2.414L6 11.914V13.5h1.586l7.5-7.5L13.5 4.414zM3 17.5a.5.5 0 0 1 0-1h14a.5.5 0 0 1 0 1H3z"/>
            </svg>
          </div>
        </div>

        <button type="submit" className="create-btn">+ ADD BLOCK</button>
      </form>

      {settings.showQuotes !== false && (
        <p className="app-quote">"{quote.text}" — {quote.author}</p>
      )}
    </div>
  )
}
