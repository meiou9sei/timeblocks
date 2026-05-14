import { useState, useEffect, useRef } from 'react'

function BeerMugIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="procrast-beer-icon">
      <circle cx="4.5" cy="7"   r="2.2" />
      <circle cx="8.5" cy="5.5" r="2.8" />
      <circle cx="12.5" cy="7"  r="2.2" />
      <path d="M3 7h11v11a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 18V7z" />
      <path d="M14 9.5h1.5a2 2 0 0 1 0 4H14v-1.5h1.5a.5.5 0 0 0 0-1H14V9.5z" />
    </svg>
  )
}

export default function ProcrastModal({ tasks, onAdd, onToggle, onDelete, onClearDone, onReorder, onEdit, onImport, onClose }) {
  const [input,       setInput]       = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [dragId,      setDragId]      = useState(null)
  const [overId,      setOverId]      = useState(null)
  const [editingId,   setEditingId]   = useState(null)
  const [editText,    setEditText]    = useState('')
  const editInputRef = useRef(null)
  const importInputRef = useRef(null)

  function handleExport() {
    const data = JSON.stringify(tasks, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'happy-hour-list.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (Array.isArray(parsed)) onImport(parsed)
      } catch { /* ignore bad files */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (editingId) { setEditingId(null); return }
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, editingId])

  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus()
  }, [editingId])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return
    onAdd(input.trim())
    setInput('')
  }

  function startEdit(task) {
    setEditingId(task.id)
    setEditText(task.text)
  }

  function commitEdit() {
    if (editText.trim() && editingId) onEdit(editingId, editText.trim())
    setEditingId(null)
  }

  function handleEditKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setEditingId(null) }
  }

  function handleDragStart(e, id) {
    if (editingId) return
    e.stopPropagation()
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, id) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== overId) setOverId(id)
  }

  function handleDrop(e, id) {
    e.preventDefault()
    e.stopPropagation()
    if (!dragId || dragId === id) { setDragId(null); setOverId(null); return }
    const fromIdx = tasks.findIndex(t => t.id === dragId)
    const toIdx   = tasks.findIndex(t => t.id === id)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...tasks]
    const [item] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, item)
    onReorder(next)
    setDragId(null)
    setOverId(null)
  }

  function handleDragEnd() {
    setDragId(null)
    setOverId(null)
  }

  const pending = tasks.filter(t => !t.done)
  const done    = tasks.filter(t =>  t.done)

  function renderItem(task, isDone) {
    const isEditing = editingId === task.id
    return (
      <li
        key={task.id}
        className={[
          'procrast-item',
          isDone        ? 'procrast-item--done'      : '',
          overId === task.id && dragId !== task.id ? 'procrast-item--drag-over' : '',
          dragId === task.id ? 'procrast-item--dragging' : '',
          isEditing     ? 'procrast-item--editing'   : '',
        ].join(' ')}
        draggable={!isEditing}
        onDragStart={e => handleDragStart(e, task.id)}
        onDragOver={e => handleDragOver(e, task.id)}
        onDrop={e => handleDrop(e, task.id)}
        onDragEnd={handleDragEnd}
      >
        <span className="procrast-drag-handle" aria-hidden="true">⠿</span>
        <button
          className={`procrast-check${isDone ? ' procrast-check--done' : ''}`}
          onClick={() => onToggle(task.id)}
          title={isDone ? 'Mark undone' : 'Mark done'}
        >{isDone ? '✓' : '○'}</button>

        {isEditing ? (
          <input
            ref={editInputRef}
            className="procrast-edit-input"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKey}
            maxLength={100}
          />
        ) : (
          <span
            className="procrast-item-text"
            onDoubleClick={() => startEdit(task)}
            title="Double-click to edit"
          >{task.text}</span>
        )}

        {!isEditing && (
          <button className="procrast-edit-btn" onClick={() => startEdit(task)} title="Edit">✎</button>
        )}
        <button className="procrast-delete" onClick={() => onDelete(task.id)} title="Delete">×</button>
      </li>
    )
  }

  return (
    <div className="procrast-overlay">
      <header className="procrast-header">
        <div className="procrast-title-block">
          <div className="procrast-title-row">
            <BeerMugIcon />
            <h2 className="procrast-title">PROCRASTINATION HAPPY HOUR</h2>
          </div>
          <p className="procrast-subtitle">things you'll definitely get to… eventually</p>
        </div>
        <div className="procrast-header-actions">
          <button className="procrast-io-btn" onClick={handleExport} title="Export list as JSON">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: '0.85em', height: '0.85em', verticalAlign: 'text-bottom', marginRight: '0.3em' }}>
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            Export
          </button>
          <button className="procrast-io-btn" onClick={() => importInputRef.current.click()} title="Import list from JSON">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: '0.85em', height: '0.85em', verticalAlign: 'text-bottom', marginRight: '0.3em' }}>
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
            Import
          </button>
          <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          <button className="procrast-close" onClick={onClose} title="Close">✕</button>
        </div>
      </header>

      <div className="procrast-body">
        {tasks.length === 0 && (
          <p className="procrast-empty-msg">Nothing here yet. What have you been putting off?</p>
        )}

        {pending.length > 0 && (
          <ul className="procrast-list">
            {pending.map(task => renderItem(task, false))}
          </ul>
        )}

        {done.length > 0 && (
          <>
            <div className="procrast-done-divider">
              <span>— done —</span>
              {!confirmClear ? (
                <button className="procrast-clear-btn" onClick={() => setConfirmClear(true)}>
                  CLOSE OUT THE TAB
                </button>
              ) : (
                <span className="procrast-clear-confirm">
                  <button className="procrast-clear-btn procrast-clear-btn--danger" onClick={() => { onClearDone(); setConfirmClear(false) }}>
                    YEAH, WIPE 'EM
                  </button>
                  <button className="procrast-clear-btn procrast-clear-btn--cancel" onClick={() => setConfirmClear(false)}>
                    NEVER MIND
                  </button>
                </span>
              )}
            </div>
            <ul className="procrast-list">
              {done.map(task => renderItem(task, true))}
            </ul>
          </>
        )}
      </div>

      <form className="procrast-add-form" onSubmit={handleSubmit}>
        <input
          className="procrast-input"
          placeholder="What have you been putting off..."
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={100}
          autoFocus={!window.matchMedia('(max-width: 640px)').matches}
        />
        <button type="submit" className="procrast-add-btn">+ ADD</button>
      </form>
    </div>
  )
}
