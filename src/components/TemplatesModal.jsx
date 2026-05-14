import { useState } from 'react'

const TMPL_SLOT_H = 2.5 // px per slot → 120px total for 48 slots

function TemplateMinimap({ placedItems, blockDefs }) {
  return (
    <div className="tmpl-minimap">
      {placedItems.map((p, i) => {
        const block = blockDefs[p.blockId]
        if (!block) return null
        return (
          <div
            key={i}
            className="tmpl-minimap-block"
            style={{
              top:    p.startSlot * TMPL_SLOT_H,
              height: Math.max(2, p.duration * TMPL_SLOT_H - 0.5),
              background: block.color,
            }}
          />
        )
      })}
    </div>
  )
}

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function TemplateCard({ template, onApply, onDelete, onRename }) {
  const [track,       setTrack]       = useState('ideal')
  const [replace,     setReplace]     = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState(template.name)

  function commitRename() {
    if (nameInput.trim() && nameInput.trim() !== template.name) {
      onRename(template.id, nameInput.trim())
    } else {
      setNameInput(template.name)
    }
    setEditingName(false)
  }

  function handleNameKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitRename() }
    if (e.key === 'Escape') { setNameInput(template.name); setEditingName(false) }
  }

  return (
    <div className="tmpl-card">
      <TemplateMinimap placedItems={template.placedItems} blockDefs={template.blockDefs} />

      <div className="tmpl-card-content">
        <div className="tmpl-card-header">
          <div className="tmpl-card-meta">
            {editingName ? (
              <input
                className="tmpl-name-input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleNameKey}
                autoFocus
                maxLength={60}
              />
            ) : (
              <span className="tmpl-card-name" title="Double-click to rename" onDoubleClick={() => setEditingName(true)}>
                {template.name}
              </span>
            )}
            <span className="tmpl-card-info">
              {template.placedItems.length} block{template.placedItems.length !== 1 ? 's' : ''}
              {' · '}saved from {template.savedTrack}
              {' · '}{formatDate(template.savedAt)}
            </span>
          </div>
          <div className="tmpl-card-header-actions">
            {!editingName && (
              <button className="tmpl-rename-btn" onClick={() => setEditingName(true)} title="Rename">✎</button>
            )}
            <button className="tmpl-delete" onClick={() => onDelete(template.id)} title="Delete template">×</button>
          </div>
        </div>

        <div className="tmpl-card-controls">
          <div className="toggle-group">
            <button className={`toggle-btn ${track === 'ideal'  ? 'toggle-btn--active' : ''}`} onClick={() => setTrack('ideal')}>IDEAL</button>
            <button className={`toggle-btn ${track === 'actual' ? 'toggle-btn--active' : ''}`} onClick={() => setTrack('actual')}>ACTUAL</button>
          </div>
          <div className="toggle-group">
            <button className={`toggle-btn ${replace  ? 'toggle-btn--active' : ''}`} onClick={() => setReplace(true)}>REPLACE</button>
            <button className={`toggle-btn ${!replace ? 'toggle-btn--active' : ''}`} onClick={() => setReplace(false)}>APPEND</button>
          </div>
          <button className="tmpl-apply-btn" onClick={() => onApply(template, track, replace)}>APPLY</button>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesModal({ templates, ideal, actual, onSave, onApply, onDelete, onRename, onClose }) {
  const [name,      setName]      = useState('')
  const [saveTrack, setSaveTrack] = useState('ideal')

  function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), saveTrack)
    setName('')
  }

  const trackIsEmpty = saveTrack === 'ideal' ? ideal.length === 0 : actual.length === 0

  return (
    <div className="tmpl-overlay">
      <header className="tmpl-header">
        <div className="tmpl-title-block">
          <h2 className="tmpl-title">TEMPLATES</h2>
          <p className="tmpl-subtitle">save and reapply your daily layouts</p>
        </div>
        <button className="procrast-close" onClick={onClose} title="Close">✕</button>
      </header>

      <div className="tmpl-body">
        {templates.length === 0 ? (
          <p className="tmpl-empty">No templates saved yet. Build a schedule and save it below.</p>
        ) : (
          templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onApply={onApply}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))
        )}
      </div>

      <form className="tmpl-save-form" onSubmit={handleSave}>
        <div className="tmpl-save-row">
          <input
            className="procrast-input"
            placeholder="Template name..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
          />
          <div className="toggle-group">
            <button type="button" className={`toggle-btn ${saveTrack === 'ideal'  ? 'toggle-btn--active' : ''}`} onClick={() => setSaveTrack('ideal')}>IDEAL</button>
            <button type="button" className={`toggle-btn ${saveTrack === 'actual' ? 'toggle-btn--active' : ''}`} onClick={() => setSaveTrack('actual')}>ACTUAL</button>
          </div>
          <button
            type="submit"
            className="procrast-add-btn"
            disabled={!name.trim() || trackIsEmpty}
            title={trackIsEmpty ? `${saveTrack} track is empty` : ''}
          >SAVE</button>
        </div>
        {trackIsEmpty && <p className="tmpl-save-hint">The {saveTrack} track is empty — nothing to save.</p>}
      </form>
    </div>
  )
}
