import { useState, useEffect, useRef } from 'react'

const SLOT_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const h24 = Math.floor(i / 2)
  const mins = (i % 2) * 30
  const h12 = h24 % 12 || 12
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const mm = mins === 0 ? '00' : '30'
  return { slot: i, label: `${h12}:${mm} ${ampm}` }
})

const GAP_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: '30 min' },
  { value: 2, label: '1 hr' },
]

const INTAKE_DURATIONS = [
  { slots: 1,  label: '30 min' },
  { slots: 2,  label: '1 hr' },
  { slots: 3,  label: '1 hr 30 min' },
  { slots: 4,  label: '2 hr' },
  { slots: 5,  label: '2 hr 30 min' },
  { slots: 6,  label: '3 hr' },
  { slots: 8,  label: '4 hr' },
]

const INTAKE_COLORS = [
  '#00e5ff', '#4ade80', '#f9e040', '#a855f7', '#f97316',
  '#ef4444', '#3b82f6', '#f472b6', '#34d399', '#fb923c',
]

function buildOccupiedSlots(track, replaceExisting, ideal, actual) {
  if (replaceExisting) return new Set()
  const placed = track === 'ideal' ? ideal : actual
  const s = new Set()
  for (const p of placed) {
    for (let i = p.startSlot; i < p.startSlot + p.duration; i++) s.add(i)
  }
  return s
}

function runGravityDrop(selectedBlocks, startSlot, gap, occupiedSlots) {
  let cursor = startSlot
  const placed = [], failed = []
  for (const block of selectedBlocks) {
    let start = null
    outer: for (let s = cursor; s + block.duration <= 48; s++) {
      for (let d = 0; d < block.duration; d++) { if (occupiedSlots.has(s + d)) continue outer }
      start = s; break
    }
    if (start === null) { failed.push(block); continue }
    placed.push({ blockId: block.id, startSlot: start, duration: block.duration })
    for (let d = 0; d < block.duration; d++) occupiedSlots.add(start + d)
    cursor = start + block.duration + gap
  }
  return { placed, failed }
}

function runBlueprint(selectedBlocks, windows, occupiedSlots) {
  const sorted = [...selectedBlocks].sort((a, b) => {
    const windowA = windows[a.id].notAfter - windows[a.id].notBefore - a.duration
    const windowB = windows[b.id].notAfter - windows[b.id].notBefore - b.duration
    return windowA - windowB
  })

  const occupied = new Set(occupiedSlots)
  let iterations = 0

  function solve(idx, placed) {
    if (idx === sorted.length) return placed
    if (++iterations > 10000) return null

    const block = sorted[idx]
    const { notBefore, notAfter } = windows[block.id]
    const searchEnd = Math.min(notAfter, 48 - block.duration)

    for (let s = notBefore; s <= searchEnd; s++) {
      let fits = true
      for (let d = 0; d < block.duration; d++) {
        if (occupied.has(s + d)) { fits = false; break }
      }
      if (!fits) continue

      for (let d = 0; d < block.duration; d++) occupied.add(s + d)
      const result = solve(idx + 1, [...placed, { blockId: block.id, startSlot: s, duration: block.duration }])
      if (result !== null) return result
      for (let d = 0; d < block.duration; d++) occupied.delete(s + d)
    }

    return null
  }

  const result = solve(0, [])

  if (result !== null) {
    return { placed: result, failed: [] }
  }

  const placed = [], failed = []
  const fallbackOccupied = new Set(occupiedSlots)
  for (const block of sorted) {
    const { notBefore, notAfter } = windows[block.id]
    const searchEnd = Math.min(notAfter, 48 - block.duration)
    let start = null
    outer: for (let s = notBefore; s <= searchEnd; s++) {
      for (let d = 0; d < block.duration; d++) { if (fallbackOccupied.has(s + d)) continue outer }
      start = s; break
    }
    if (start === null) { failed.push(block); continue }
    placed.push({ blockId: block.id, startSlot: start, duration: block.duration })
    for (let d = 0; d < start + block.duration; d++) fallbackOccupied.add(start + d)
  }
  return { placed, failed }
}

export default function ScheduleBuilderModal({ blocks: allBlocks, ideal, actual, onApply, onClose }) {
  const blocks = allBlocks.filter(b => !b.deleted && !b.procrast)
  const [mode,            setMode]    = useState('gravity')
  const [track,           setTrack]   = useState('ideal')
  const [replaceExisting, setReplace] = useState(true)
  const [selected,        setSelected] = useState(() =>
    Object.fromEntries(blocks.map(b => [b.id, true]))
  )
  const [startSlot, setStartSlot] = useState(14)
  const [gap,       setGap]       = useState(0)
  const [blockOrder, setBlockOrder] = useState(() => blocks.map(b => b.id))
  const dragOrderRef = useRef(null)
  const [windows,   setWindows]   = useState(() =>
    Object.fromEntries(blocks.map(b => [b.id, { notBefore: 0, notAfter: 47 }]))
  )
  const [preview, setPreview] = useState(null)
  const [hasRun,  setHasRun]  = useState(false)

  // Intake mode state
  const [intakeTasks, setIntakeTasks] = useState([])
  const [intakeName,  setIntakeName]  = useState('')
  const [intakeDur,   setIntakeDur]   = useState(2)
  const [intakeColor, setIntakeColor] = useState(INTAKE_COLORS[0])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    setHasRun(false)
    setPreview(null)
  }, [mode, track, replaceExisting, selected, startSlot, gap, windows, intakeTasks])

  function toggleBlock(id) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function updateWindow(blockId, field, value) {
    setWindows(prev => ({ ...prev, [blockId]: { ...prev[blockId], [field]: value } }))
  }

  function handleOrderDragStart(e, id) {
    dragOrderRef.current = id
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleOrderDragOver(e, overId) {
    e.preventDefault()
    if (!dragOrderRef.current || dragOrderRef.current === overId) return
    setBlockOrder(prev => {
      const arr = [...prev]
      const from = arr.indexOf(dragOrderRef.current)
      const to   = arr.indexOf(overId)
      if (from === -1 || to === -1) return prev
      arr.splice(from, 1)
      arr.splice(to, 0, dragOrderRef.current)
      return arr
    })
  }

  function handleOrderDragEnd() {
    dragOrderRef.current = null
  }

  function handleAddIntakeTask() {
    if (!intakeName.trim()) return
    setIntakeTasks(prev => [...prev, {
      id: crypto.randomUUID(),
      name: intakeName.trim(),
      duration: intakeDur,
      color: intakeColor,
    }])
    setIntakeName('')
  }

  function removeIntakeTask(id) {
    setIntakeTasks(prev => prev.filter(t => t.id !== id))
  }

  function handleRun() {
    if (mode === 'intake') {
      if (intakeTasks.length === 0) {
        setPreview({ placed: [], failed: [], warning: 'No tasks added.' })
        setHasRun(true)
        return
      }
      const occupied = buildOccupiedSlots(track, replaceExisting, ideal, actual)
      const result = runGravityDrop(intakeTasks, startSlot, gap, occupied)
      const placedIds = new Set(result.placed.map(p => p.blockId))
      setPreview({ ...result, newBlocks: intakeTasks.filter(t => placedIds.has(t.id)) })
      setHasRun(true)
      return
    }

    const selectedBlocks = orderedBlocks.filter(b => selected[b.id])
    if (selectedBlocks.length === 0) {
      setPreview({ placed: [], failed: [], warning: 'No blocks selected.' })
      setHasRun(true)
      return
    }
    const occupied = buildOccupiedSlots(track, replaceExisting, ideal, actual)
    const result = mode === 'gravity'
      ? runGravityDrop(selectedBlocks, startSlot, gap, occupied)
      : runBlueprint(selectedBlocks, windows, occupied)
    setPreview(result)
    setHasRun(true)
  }

  function handleApply() {
    if (!preview || preview.placed.length === 0) return
    onApply(preview.placed, track, replaceExisting, preview.newBlocks ?? [])
    onClose()
  }

  const orderedBlocks = blockOrder.map(id => blocks.find(b => b.id === id)).filter(Boolean)
  const selectedBlocks = orderedBlocks.filter(b => selected[b.id])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sb-modal" onClick={e => e.stopPropagation()}>

        {/* Fixed top: header + mode tabs always visible */}
        <div className="sb-modal-top">
          <div className="settings-modal-header">
            <span className="settings-modal-title">SCHEDULE BUILDER</span>
            <button className="settings-modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="toggle-group sb-mode-tabs">
            <button
              className={`toggle-btn ${mode === 'gravity' ? 'toggle-btn--active' : ''}`}
              onClick={() => setMode('gravity')}
            >GRAVITY DROP</button>
            <button
              className={`toggle-btn ${mode === 'blueprint' ? 'toggle-btn--active' : ''}`}
              onClick={() => setMode('blueprint')}
            >BLUEPRINT</button>
            <button
              className={`toggle-btn ${mode === 'intake' ? 'toggle-btn--active' : ''}`}
              onClick={() => setMode('intake')}
            >DAILY INTAKE</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="sb-modal-body">

        {/* ── DAILY INTAKE mode ── */}
        {mode === 'intake' && (<>

          <div className="sb-section">
            <div className="settings-label">ADD TODAY'S TASKS</div>
            <div className="sb-intake-form">
              <input
                className="create-input sb-intake-name"
                placeholder="Task name..."
                value={intakeName}
                onChange={e => setIntakeName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddIntakeTask()}
              />
              <select
                className="create-select"
                value={intakeDur}
                onChange={e => setIntakeDur(Number(e.target.value))}
              >
                {INTAKE_DURATIONS.map(o => (
                  <option key={o.slots} value={o.slots}>{o.label}</option>
                ))}
              </select>
              <button className="sb-intake-add" onClick={handleAddIntakeTask}>+ Add</button>
            </div>
            <div className="sb-intake-colors">
              {INTAKE_COLORS.map(c => (
                <button
                  key={c}
                  className={`sb-intake-swatch ${intakeColor === c ? 'sb-intake-swatch--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setIntakeColor(c)}
                />
              ))}
            </div>

            {intakeTasks.length > 0 && (
              <div className="sb-intake-list">
                {intakeTasks.map(t => (
                  <div key={t.id} className="sb-intake-row">
                    <span className="sb-block-swatch" style={{ background: t.color }} />
                    <span className="sb-block-label">{t.name}</span>
                    <span className="sb-block-dur">
                      {Math.floor(t.duration / 2)}h{t.duration % 2 ? '30' : ''}m
                    </span>
                    <button className="sb-intake-remove" onClick={() => removeIntakeTask(t.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="settings-hint">
              Tasks are placed in order from the start time. New blocks are added to your palette.
            </p>
          </div>

          <div className="sb-section">
            <div className="settings-label">START TIME</div>
            <select
              className="create-select"
              value={startSlot}
              onChange={e => setStartSlot(Number(e.target.value))}
            >
              {SLOT_OPTIONS.slice(0, 48).map(o => (
                <option key={o.slot} value={o.slot}>{o.label}</option>
              ))}
            </select>

            <div className="settings-label" style={{ marginTop: '0.6rem' }}>GAP BETWEEN TASKS</div>
            <div className="toggle-group">
              {GAP_OPTIONS.map(g => (
                <button
                  key={g.value}
                  className={`toggle-btn ${gap === g.value ? 'toggle-btn--active' : ''}`}
                  onClick={() => setGap(g.value)}
                >{g.label}</button>
              ))}
            </div>
          </div>

        </>)}

        {/* ── GRAVITY DROP / BLUEPRINT modes ── */}
        {mode !== 'intake' && (<>

        {/* Block selection */}
        <div className="sb-section">
          <div className="settings-label">SELECT BLOCKS</div>
          <div className="sb-block-list">
            {orderedBlocks.map(b => (
              <label
                key={b.id}
                className="sb-block-row"
                draggable={mode === 'gravity'}
                onDragStart={mode === 'gravity' ? e => handleOrderDragStart(e, b.id) : undefined}
                onDragOver={mode === 'gravity' ? e => handleOrderDragOver(e, b.id) : undefined}
                onDragEnd={mode === 'gravity' ? handleOrderDragEnd : undefined}
              >
                {mode === 'gravity' && (
                  <span className="sb-drag-handle">⠿</span>
                )}
                <input
                  type="checkbox"
                  checked={!!selected[b.id]}
                  onChange={() => toggleBlock(b.id)}
                />
                <span className="sb-block-swatch" style={{ background: b.color }} />
                <span className="sb-block-label">{b.name}</span>
                <span className="sb-block-dur">{Math.floor(b.duration / 2)}h{b.duration % 2 ? '30' : ''}m</span>
              </label>
            ))}
          </div>
          {mode === 'gravity' && (
            <p className="settings-hint">Blocks are placed in the order shown. Drag to reorder.</p>
          )}
        </div>

        {/* Mode-specific fields */}
        {mode === 'gravity' ? (
          <div className="sb-section">
            <div className="settings-label">START TIME</div>
            <select
              className="create-select"
              value={startSlot}
              onChange={e => setStartSlot(Number(e.target.value))}
            >
              {SLOT_OPTIONS.slice(0, 48).map(o => (
                <option key={o.slot} value={o.slot}>{o.label}</option>
              ))}
            </select>

            <div className="settings-label" style={{ marginTop: '0.6rem' }}>GAP BETWEEN BLOCKS</div>
            <div className="toggle-group">
              {GAP_OPTIONS.map(g => (
                <button
                  key={g.value}
                  className={`toggle-btn ${gap === g.value ? 'toggle-btn--active' : ''}`}
                  onClick={() => setGap(g.value)}
                >{g.label}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="sb-section">
            <div className="settings-label">TIME WINDOWS</div>
            {selectedBlocks.length === 0 ? (
              <p className="settings-hint">Select blocks above to configure windows.</p>
            ) : (
              <div className="sb-blueprint-grid">
                <div className="sb-bp-header">Block</div>
                <div className="sb-bp-header">Not Before</div>
                <div className="sb-bp-header">Not After</div>
                {selectedBlocks.map(b => {
                  const win = windows[b.id]
                  const invalid = win.notBefore > win.notAfter
                  return (
                    <>
                      <div key={`name-${b.id}`} className="sb-bp-name">
                        <span className="sb-block-swatch" style={{ background: b.color }} />
                        {b.name}
                      </div>
                      <select
                        key={`before-${b.id}`}
                        className={`create-select sb-bp-select ${invalid ? 'sb-bp-select--error' : ''}`}
                        value={win.notBefore}
                        onChange={e => updateWindow(b.id, 'notBefore', Number(e.target.value))}
                      >
                        {SLOT_OPTIONS.slice(0, 48).map(o => (
                          <option key={o.slot} value={o.slot}>{o.label}</option>
                        ))}
                      </select>
                      <select
                        key={`after-${b.id}`}
                        className={`create-select sb-bp-select ${invalid ? 'sb-bp-select--error' : ''}`}
                        value={win.notAfter}
                        onChange={e => updateWindow(b.id, 'notAfter', Number(e.target.value))}
                      >
                        {SLOT_OPTIONS.slice(0, 48).map(o => (
                          <option key={o.slot} value={o.slot}>{o.label}</option>
                        ))}
                      </select>
                      {invalid && (
                        <div key={`err-${b.id}`} className="sb-bp-error">
                          Not Before must be ≤ Not After
                        </div>
                      )}
                    </>
                  )
                })}
              </div>
            )}
          </div>
        )}

        </>)}

        {/* Target + replace (all modes) */}
        <div className="sb-section sb-options-row">
          <div>
            <div className="settings-label">TARGET TRACK</div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${track === 'ideal' ? 'toggle-btn--active' : ''}`}
                onClick={() => setTrack('ideal')}
              >IDEAL</button>
              <button
                className={`toggle-btn ${track === 'actual' ? 'toggle-btn--active' : ''}`}
                onClick={() => setTrack('actual')}
              >ACTUAL</button>
            </div>
          </div>
          <div>
            <div className="settings-label">EXISTING BLOCKS</div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${!replaceExisting ? 'toggle-btn--active' : ''}`}
                onClick={() => setReplace(false)}
              >APPEND</button>
              <button
                className={`toggle-btn ${replaceExisting ? 'toggle-btn--active' : ''}`}
                onClick={() => setReplace(true)}
              >REPLACE</button>
            </div>
          </div>
        </div>

        {/* Results */}
        {hasRun && preview && (
          <div className="sb-results">
            {preview.warning ? (
              <div className="sb-results-warning">{preview.warning}</div>
            ) : (
              <>
                <div className="sb-results-ok">{preview.placed.length} {mode === 'intake' ? 'task' : 'block'}{preview.placed.length !== 1 ? 's' : ''} scheduled</div>
                {preview.failed.length > 0 && (
                  <div className="sb-results-fail">
                    Could not place: {preview.failed.map(b => b.name).join(', ')}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="sb-footer">
          <button className="create-btn sb-run-btn" onClick={handleRun}>
            {hasRun ? 'RE-RUN' : 'RUN'}
          </button>
          {hasRun && preview?.placed.length > 0 && (
            <button className="create-btn" onClick={handleApply}>APPLY</button>
          )}
        </div>

        </div>{/* end sb-modal-body */}
      </div>
    </div>
  )
}
