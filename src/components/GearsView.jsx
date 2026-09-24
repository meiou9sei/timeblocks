import { useMemo, useState } from 'react'
import { gearDayStr, shiftDateStr, formatDateLabel, pastDates } from '../utils/date.js'

const uid = () => Math.random().toString(36).slice(2)
const HEATMAP_DAYS = 35

function emptyField() {
  return { id: uid(), name: '', gears: ['', '', '', ''], startDate: gearDayStr() }
}

function cloneFields(fields) {
  return fields.map(f => ({ ...f, gears: [...f.gears] }))
}

export default function GearsView({ fields, gearLog, onFieldsChange, onLogChange }) {
  const today = gearDayStr()

  const [date, setDate] = useState(today)
  const [configuring, setConfiguring] = useState(fields.length === 0)
  const [draftFields, setDraftFields] = useState(fields.length ? cloneFields(fields) : [emptyField()])
  const [expandedId, setExpandedId] = useState(null)
  const [justAddedId, setJustAddedId] = useState(null)

  const dayLog = gearLog[date] ?? {}

  const heatmapDates = useMemo(() => pastDates(today, HEATMAP_DAYS), [today])

  function setLevel(fieldId, level) {
    const current = dayLog[fieldId] ?? 0
    const nextLevel = current === level ? 0 : level
    onLogChange({ ...gearLog, [date]: { ...dayLog, [fieldId]: nextLevel } })
  }

  function openConfigure() {
    setDraftFields(fields.length ? cloneFields(fields) : [emptyField()])
    setJustAddedId(null)
    setConfiguring(true)
  }

  function saveConfig() {
    const cleaned = draftFields.map(f => ({ ...f, name: f.name.trim() })).filter(f => f.name)
    onFieldsChange(cleaned)
    setConfiguring(false)
  }

  function addField() {
    const f = emptyField()
    setDraftFields(prev => [...prev, f])
    setJustAddedId(f.id)
  }
  function removeField(id) {
    setDraftFields(prev => prev.filter(f => f.id !== id))
  }
  function renameField(id, name) {
    setDraftFields(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  }
  function setFieldStartDate(id, startDate) {
    setDraftFields(prev => prev.map(f => f.id === id ? { ...f, startDate } : f))
  }
  function setGearText(id, idx, text) {
    setDraftFields(prev => prev.map(f => f.id === id ? { ...f, gears: f.gears.map((g, i) => i === idx ? text : g) } : f))
  }

  if (configuring) {
    return (
      <div className="gears-view">
        <div className="gears-view-header">
          <span className="gears-view-title">CONFIGURE GEARS</span>
        </div>

        <div className="gears-configure">
          {draftFields.map(f => (
            <div key={f.id} className="gears-config-field">
              <div className="gears-config-field-header">
                <input
                  className="create-input"
                  placeholder="Field name (e.g. Read)"
                  value={f.name}
                  onChange={e => renameField(f.id, e.target.value)}
                  maxLength={200}
                  autoFocus={f.id === justAddedId}
                />
                <button type="button" className="gears-field-remove" onClick={() => removeField(f.id)} title="Remove field">×</button>
              </div>
              <label className="gears-config-gear-row">
                <span className="gears-config-gear-label">Since</span>
                <input
                  className="create-input"
                  type="date"
                  value={f.startDate ?? ''}
                  onChange={e => setFieldStartDate(f.id, e.target.value)}
                  title="Days before this won't be marked as missed in the heatmap"
                />
              </label>
              {f.gears.map((g, i) => (
                <label key={i} className="gears-config-gear-row">
                  <span className="gears-config-gear-label">G{i + 1}</span>
                  <input
                    className="create-input"
                    placeholder={`What counts as gear ${i + 1}...`}
                    value={g}
                    onChange={e => setGearText(f.id, i, e.target.value)}
                    maxLength={60}
                  />
                </label>
              ))}
            </div>
          ))}

          <button type="button" className="palette-edit-cancel" onClick={addField}>+ Add field</button>

          <div className="gears-config-actions">
            {fields.length > 0 && (
              <button type="button" className="palette-edit-cancel" onClick={() => setConfiguring(false)}>Cancel</button>
            )}
            <button type="button" className="create-btn" onClick={saveConfig} disabled={!draftFields.some(f => f.name.trim())}>
              Save fields
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gears-view">
      <div className="gears-view-header">
        <span className="gears-view-title">GEARS · no zero days</span>
        <button type="button" className="gears-configure-link" onClick={openConfigure}>
          {fields.length === 0 ? 'Set up fields' : 'Configure'}
        </button>
      </div>

      <div className="gears-date-nav">
        <button type="button" className="gears-date-btn" onClick={() => setDate(d => shiftDateStr(d, -1))} title="Previous day">‹</button>
        <span className="gears-date-label">{date === today ? 'Today' : formatDateLabel(date)}</span>
        <button type="button" className="gears-date-btn" onClick={() => setDate(d => shiftDateStr(d, 1))} disabled={date >= today} title="Next day">›</button>
      </div>

      <div className="gears-view-body">
        {fields.length === 0 && (
          <p className="gears-empty">No fields yet. Set up what you want to track every day — reading, running, whatever it is.</p>
        )}

        {fields.map(field => {
          const level = dayLog[field.id] ?? 0
          const isExpanded = expandedId === field.id
          return (
            <div key={field.id} className={`gears-field gears-field--lvl${level}`}>
              <button
                type="button"
                className="gears-field-row"
                onClick={() => setExpandedId(isExpanded ? null : field.id)}
              >
                <span className="gears-field-name">{field.name}</span>
                <span className="gears-pips">
                  {field.gears.map((_, i) => (
                    <span key={i} className={`gears-pip${i < level ? ' gears-pip--filled' : ''}`} />
                  ))}
                </span>
                <span className="gears-field-active-text">{level > 0 ? field.gears[level - 1] || `Gear ${level}` : '—'}</span>
              </button>

              {isExpanded && (
                <div className="gears-carousel">
                  <div className="gears-carousel-viewport">
                    <div
                      className="gears-carousel-track"
                      style={{ transform: `translateX(calc(${-level} * (var(--card-w) + var(--card-gap))))` }}
                    >
                      {[-1, 0, 1, 2, 3, 4, 5].map(slotLevel => {
                        if (slotLevel < 0 || slotLevel > 4) {
                          return <div key={slotLevel} className="gears-carousel-card gears-carousel-card--empty" aria-hidden="true" />
                        }
                        const isActive = slotLevel === level
                        const content = slotLevel === 0
                          ? (<>
                              <span className="gears-carousel-gear-label">Zero day</span>
                              <span className="gears-carousel-gear-text">Do the MVP!</span>
                            </>)
                          : (<>
                              <span className="gears-carousel-gear-label">Gear {slotLevel}</span>
                              <span className="gears-carousel-gear-text">{field.gears[slotLevel - 1] || '—'}</span>
                            </>)
                        if (isActive) {
                          return (
                            <div key={slotLevel} className="gears-carousel-card gears-carousel-card--active">
                              {content}
                            </div>
                          )
                        }
                        return (
                          <button
                            key={slotLevel}
                            type="button"
                            className="gears-carousel-card gears-carousel-card--faded"
                            onClick={() => setLevel(field.id, slotLevel)}
                          >
                            {content}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {fields.length > 0 && (
        <div className="gears-heatmap">
          <div className="gears-heatmap-header">
            <span className="gears-view-title">LAST {HEATMAP_DAYS} DAYS</span>
          </div>
          <div className="gears-heatmap-scroll">
            <div className="gears-heatmap-rows">
              {fields.map(field => (
                <div key={field.id} className="gears-heatmap-row">
                  <span className="gears-heatmap-label" title={field.name}>{field.name}</span>
                  <div className="gears-heatmap-cells">
                    {heatmapDates.map(d => {
                      const started = !field.startDate || d >= field.startDate
                      if (!started) {
                        return <span key={d} className="gears-heatmap-cell gears-heatmap-cell--untracked" title={`${formatDateLabel(d)} — not tracked yet`} />
                      }
                      const lvl = gearLog[d]?.[field.id] ?? 0
                      return (
                        <span
                          key={d}
                          className={`gears-heatmap-cell gears-heatmap-cell--lvl${lvl}`}
                          title={`${formatDateLabel(d)} — ${lvl > 0 ? `Gear ${lvl}` : 'not started'}`}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="gears-heatmap-row gears-heatmap-row--overall">
                <span className="gears-heatmap-label" title="The lowest gear across all fields that day — your real bottleneck">OVERALL</span>
                <div className="gears-heatmap-cells">
                  {heatmapDates.map(d => {
                    const activeFields = fields.filter(f => !f.startDate || d >= f.startDate)
                    if (activeFields.length === 0) {
                      return <span key={d} className="gears-heatmap-cell gears-heatmap-cell--untracked" title={`${formatDateLabel(d)} — not tracked yet`} />
                    }
                    const lvl = Math.min(...activeFields.map(f => gearLog[d]?.[f.id] ?? 0))
                    return (
                      <span
                        key={d}
                        className={`gears-heatmap-cell gears-heatmap-cell--lvl${lvl}`}
                        title={`${formatDateLabel(d)} — bottleneck: ${lvl > 0 ? `Gear ${lvl}` : 'not started'}`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
