import { useState, useEffect, useRef } from 'react'

export default function DistractionsModal({ tasks, onAdd, onToggle, onDelete, onClearDone, onReorder, onEdit, onClose }) {
  const [input,        setInput]        = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [dragId,       setDragId]       = useState(null)
  const [overId,       setOverId]       = useState(null)
  const [editingId,    setEditingId]    = useState(null)
  const [editText,     setEditText]     = useState('')
  const editInputRef = useRef(null)

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
    if (e.key === 'Escape') { e.stopPropagation(); setEditingId(null) }
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
          isDone ? 'procrast-item--done' : '',
          overId === task.id && dragId !== task.id ? 'procrast-item--drag-over' : '',
          dragId === task.id ? 'procrast-item--dragging' : '',
          isEditing ? 'procrast-item--editing' : '',
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
            maxLength={5000}
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
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="distractions-icon">
              <path d="M10 2a7 7 0 1 0 4.95 11.95l2.83 2.83a1 1 0 0 0 1.41-1.41l-2.83-2.83A7 7 0 0 0 10 2zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 10 4z"/>
              <circle cx="7.5" cy="9" r="1"/>
              <circle cx="10" cy="9" r="1"/>
              <circle cx="12.5" cy="9" r="1"/>
            </svg>
            <h2 className="procrast-title">BRAIN DUMP</h2>
          </div>
          <p className="procrast-subtitle">distractions rattling around in your head</p>
        </div>
        <div className="procrast-header-actions">
          <button className="procrast-close" onClick={onClose} title="Close">✕</button>
        </div>
      </header>

      <div className="procrast-body">
        {tasks.length === 0 && (
          <p className="procrast-empty-msg">Nothing here yet. What's pulling your attention?</p>
        )}

        {pending.length > 0 && (
          <ul className="procrast-list">
            {pending.map(task => renderItem(task, false))}
          </ul>
        )}

        {done.length > 0 && (
          <>
            <div className="procrast-done-divider">
              <span>— handled —</span>
              {!confirmClear ? (
                <button className="procrast-clear-btn" onClick={() => setConfirmClear(true)}>
                  CLEAR HANDLED
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
          placeholder="What's on your mind..."
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={5000}
          autoFocus={!window.matchMedia('(max-width: 640px)').matches}
        />
        <button type="submit" className="procrast-add-btn">+ ADD</button>
      </form>
    </div>
  )
}
