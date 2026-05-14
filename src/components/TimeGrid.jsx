import { useState, useEffect, useRef, useCallback } from 'react'

const SLOT_COUNT = 48
const ROW_H_NORMAL  = 36
const ROW_H_COMPACT = 20

function formatTime(slot, fmt = '12h') {
  const h24 = Math.floor(slot / 2)
  const mins = (slot % 2) * 30
  if (fmt === '24h') {
    return mins === 0
      ? `${String(h24).padStart(2, '0')}:00`
      : `${String(h24).padStart(2, '0')}:30`
  }
  const h12 = h24 % 12 || 12
  const ampm = h24 < 12 ? 'AM' : 'PM'
  return mins === 0 ? `${h12} ${ampm}` : `${h12}:30`
}

function formatTimeRange(startSlot, duration, fmt) {
  return `${formatTime(startSlot, fmt)} – ${formatTime(startSlot + duration, fmt)}`
}

function isLight(hex) {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 115
}

function getCurrentTimeSlot() {
  const now = new Date()
  return (now.getHours() * 60 + now.getMinutes()) / 30
}

function TrackColumn({
  track, placed, ghosts, blocks, dragInfo, hoverInfo, fmt, rowH,
  selection, selectionTrack, onSelectionChange,
  onDragOver, onDragLeave, onDrop,
  onDragStartPlaced, onDragEnd, onRemovePlaced, onResizeStart,
  onEditPlaced, justResized,
  getBlock,
  noDragMode, picking, onClickSlot, onClickPlaced,
}) {
  const [tappedId, setTappedId] = useState(null)
  const highlight = new Set()
  if (hoverInfo && hoverInfo.track === track) {
    const { slot, dragInfo: di } = hoverInfo
    const block = getBlock(di.blockId)
    if (block) {
      const duration = di.placedDuration ?? block.duration
      const startSlot = Math.max(0, slot - (di.offsetSlot ?? 0))
      for (let i = startSlot; i < Math.min(startSlot + duration, SLOT_COUNT); i++) {
        highlight.add(i)
      }
    }
  }

  return (
    <div
      className="track"
      onClick={() => setTappedId(null)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, track) }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(e, track) }}
    >
      {/* Grid cells */}
      {Array.from({ length: SLOT_COUNT }, (_, i) => (
        <div
          key={i}
          className={[
            'time-cell',
            i % 2 === 0 ? 'time-cell--hour' : '',
            highlight.has(i) ? 'time-cell--highlight' : '',
            picking ? 'time-cell--tappable' : '',
          ].join(' ')}
          onClick={picking ? (e) => { e.stopPropagation(); onClickSlot(i, track) } : undefined}
          onTouchEnd={picking ? (e) => { e.preventDefault(); e.stopPropagation(); onClickSlot(i, track) } : undefined}
        />
      ))}

      {/* Ghost blocks (ideal shown in actual track) */}
      {ghosts.map(p => {
        const block = getBlock(p.blockId)
        if (!block) return null
        return (
          <div
            key={`ghost-${p.id}`}
            className="placed-block placed-block--ghost"
            style={{
              top: p.startSlot * rowH,
              height: p.duration * rowH - 2,
              background: block.color,
            }}
          >
            <span className="placed-block-name">{block.name}</span>
          </div>
        )
      })}

      {/* Real placed blocks */}
      {placed.map(p => {
        const block = getBlock(p.blockId)
        if (!block) return null
        const light = isLight(block.color)
        const textColor = light ? '#111' : '#fff'
        const isSelected = selection.has(p.id) && selectionTrack === track

        // Dynamic line clamp based on available height
        const blockHeight = p.duration * rowH - 2
        const lineH   = rowH <= 20 ? 11 : 13   // px per desc line
        const overhead = rowH <= 20 ? 18 : 26   // name + time + padding
        const descLines = Math.max(1, Math.floor((blockHeight - overhead) / lineH))

        function handleClick(e) {
          e.stopPropagation()
          setTappedId(id => id === p.id ? null : p.id)
          if (justResized.current) { justResized.current = false; return }
          if (e.shiftKey) {
            const next = new Set(selectionTrack === track ? selection : [])
            if (next.has(p.id)) next.delete(p.id)
            else next.add(p.id)
            onSelectionChange(next, next.size > 0 ? track : null)
          } else if (window.matchMedia('(hover: hover)').matches) {
            onEditPlaced(p, track)
          }
        }

        return (
          <div
            key={p.id}
            className={`placed-block${isSelected ? ' placed-block--selected' : ''}${noDragMode && picking?.movingPlacedId === p.id ? ' placed-block--moving' : ''}${tappedId === p.id ? ' placed-block--tapped' : ''}${p.duration <= 2 ? ' placed-block--short' : ''}`}
            style={{
              top: p.startSlot * rowH,
              height: p.duration * rowH - 2,
              background: block.color,
              color: textColor,
              '--glow': block.color,
            }}
            draggable={!noDragMode}
            onClick={handleClick}
            onDragStart={(e) => onDragStartPlaced(e, p, track)}
            onDragEnd={onDragEnd}
          >
            <div className="placed-block-text">
              <span className="placed-block-name">{block.name}</span>
              {block.description && (
                <span className="placed-block-desc" style={{ WebkitLineClamp: descLines }}>{block.description}</span>
              )}
            </div>
            {p.duration > 1 && (
              <span className="placed-block-time">
                {formatTimeRange(p.startSlot, p.duration, fmt)}
              </span>
            )}
            {block.procrast && (
              <svg className="placed-block-procrast-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <circle cx="4.5"  cy="7"   r="2.2" />
                <circle cx="8.5"  cy="5.5" r="2.8" />
                <circle cx="12.5" cy="7"   r="2.2" />
                <path d="M3 7h11v11a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 18V7z" />
                <path d="M14 9.5h1.5a2 2 0 0 1 0 4H14v-1.5h1.5a.5.5 0 0 0 0-1H14V9.5z" />
              </svg>
            )}
            <div className="placed-block-buttons">
              {noDragMode && <button
                className="placed-block-move"
                style={{ color: textColor }}
                onClick={(e) => { e.stopPropagation(); onClickPlaced(p, track) }}
                title="Move"
              >
                <svg viewBox="0 0 10 14" fill="currentColor" width="10" height="14" aria-hidden="true">
                  <path d="M5 0 L8.5 4.5 H1.5 Z"/>
                  <path d="M5 14 L1.5 9.5 H8.5 Z"/>
                </svg>
              </button>}
              <button
                className="placed-block-edit"
                style={{ color: textColor }}
                onClick={(e) => { e.stopPropagation(); onEditPlaced(p, track) }}
                title="Edit"
              >✎</button>
              <button
                className="placed-block-remove"
                style={{ color: textColor }}
                onClick={(e) => { e.stopPropagation(); onRemovePlaced(p.id, track) }}
                title="Remove"
              >×</button>
            </div>
            <div
              className="placed-block-resize-top"
              onMouseDown={(e) => onResizeStart(e, p, track, true)}
              title="Drag to resize"
            />
            <div
              className="placed-block-resize"
              onMouseDown={(e) => onResizeStart(e, p, track)}
              title="Drag to resize"
            />
          </div>
        )
      })}
    </div>
  )
}

export default function TimeGrid({
  blocks, ideal, actual, dragInfo, settings, scrollRef,
  selection, selectionTrack, onSelectionChange,
  onDragStart, onDragEnd, onDrop, onResize, onRemovePlaced, onEditPlaced, getBlock, isOccupied,
  noDragMode, picking, onClickSlot, onClickPlaced,
}) {
  const [hoverInfo, setHoverInfo] = useState(null) // { track, slot }
  const [timeSlot, setTimeSlot] = useState(getCurrentTimeSlot)
  const [resizing, setResizing] = useState(null) // { placedId, track, startSlot, endSlot, isTop }
  const justResized = useRef(false)
  const internalRef = useRef(null)
  const wrapperRef = scrollRef ?? internalRef
  const idealRef = useRef(null)
  const actualRef = useRef(null)
  const fmt = settings.timeFormat ?? '12h'
  const ROW_H = settings.density === 'compact' ? ROW_H_COMPACT : ROW_H_NORMAL

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollTop = settings.startSlot * ROW_H
    }
  }, [settings.startSlot])

  useEffect(() => {
    const id = setInterval(() => setTimeSlot(getCurrentTimeSlot()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onSelectionChange(new Set(), null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onSelectionChange])

  useEffect(() => {
    if (!resizing) return

    function onMove(e) {
      const ref = resizing.track === 'ideal' ? idealRef : actualRef
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()

      if (resizing.isTop) {
        const newStart = Math.max(0, Math.min(resizing.endSlot - 1, Math.round((e.clientY - rect.top) / ROW_H)))
        const newDuration = resizing.endSlot - newStart
        if (!isOccupied(newStart, newDuration, resizing.track, resizing.placedId)) {
          onResize(resizing.placedId, newDuration, resizing.track, newStart)
        }
      } else {
        const endSlot = Math.round((e.clientY - rect.top) / ROW_H)
        const newDuration = Math.max(1, Math.min(48 - resizing.startSlot, endSlot - resizing.startSlot))
        if (!isOccupied(resizing.startSlot, newDuration, resizing.track, resizing.placedId)) {
          onResize(resizing.placedId, newDuration, resizing.track)
        }
      }
    }

    function onUp() { justResized.current = true; setResizing(null) }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing, isOccupied, onResize])

  const getSlotFromEvent = (e, ref) => {
    if (!ref.current) return 0
    const rect = ref.current.getBoundingClientRect()
    return Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor((e.clientY - rect.top) / ROW_H)))
  }

  const handleDragOver = (e, track) => {
    const ref = track === 'ideal' ? idealRef : actualRef
    const slot = getSlotFromEvent(e, ref)
    setHoverInfo(dragInfo ? { track, slot, dragInfo } : null)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setHoverInfo(null)
  }

  const handleDrop = (e, track) => {
    const ref = track === 'ideal' ? idealRef : actualRef
    const slot = getSlotFromEvent(e, ref)
    onDrop(slot, track)
    setHoverInfo(null)
  }

  const handleDragStartPlaced = (e, p, track) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetSlot = Math.floor((e.clientY - rect.top) / ROW_H)
    const isDuplicate = e.altKey

    if (!isDuplicate && selection.has(p.id) && selectionTrack === track && selection.size > 1) {
      const sourceArr = track === 'ideal' ? ideal : actual
      const multiOffsets = {}
      for (const id of selection) {
        const sp = sourceArr.find(b => b.id === id)
        if (sp) multiOffsets[id] = sp.startSlot - p.startSlot
      }
      onDragStart({
        source: 'placed',
        isMulti: true,
        placedId: p.id,
        blockId: p.blockId,
        offsetSlot,
        placedDuration: p.duration,
        fromTrack: track,
        multiIds: [...selection],
        multiOffsets,
      })
    } else {
      onDragStart({
        source: 'placed',
        isDuplicate,
        placedId: p.id,
        blockId: p.blockId,
        offsetSlot,
        placedDuration: p.duration,
        fromTrack: track,
      })
    }
  }

  const handleResizeStart = (e, p, track, isTop = false) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing({ placedId: p.id, track, startSlot: p.startSlot, endSlot: p.startSlot + p.duration, isTop })
  }

  const timeLine = timeSlot >= 0 && timeSlot <= 48 ? (
    <div className="current-time-line" style={{ top: timeSlot * ROW_H }} />
  ) : null

  return (
    <div className="time-grid-wrapper" ref={wrapperRef}>
      <div className="time-grid-inner">
        {/* Time labels */}
        <div className="time-labels">
          <div className="time-labels-spacer" aria-hidden="true" />
          {Array.from({ length: SLOT_COUNT }, (_, i) => (
            <div key={i} className={`time-label ${i % 2 === 0 ? 'time-label--hour' : ''}`}>
              {i % 2 === 0
                ? <span className="time-label-text">{formatTime(i, fmt)}</span>
                : <span className="time-label-half">·</span>}
            </div>
          ))}
        </div>

        {/* Two tracks */}
        <div className="tracks-outer">
          <div className="track-headers">
            <div className="track-header track-header--ideal">IDEAL</div>
            <div className="track-header track-header--actual">ACTUAL</div>
          </div>
          <div className="tracks-body">
            <div className="track-wrapper" ref={idealRef} onClick={() => onSelectionChange(new Set(), null)}>
              <TrackColumn
                track="ideal"
                placed={ideal}
                ghosts={[]}
                blocks={blocks}
                dragInfo={dragInfo}
                hoverInfo={hoverInfo}
                fmt={fmt}
                rowH={ROW_H}
                selection={selection}
                selectionTrack={selectionTrack}
                onSelectionChange={onSelectionChange}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragStartPlaced={handleDragStartPlaced}
                onDragEnd={onDragEnd}
                onRemovePlaced={onRemovePlaced}
                onResizeStart={handleResizeStart}
                onEditPlaced={onEditPlaced}
                justResized={justResized}
                getBlock={getBlock}
                noDragMode={noDragMode}
                picking={picking}
                onClickSlot={onClickSlot}
                onClickPlaced={onClickPlaced}
              />
            </div>

            <div className="track-divider" />

            <div className="track-wrapper" ref={actualRef} onClick={() => onSelectionChange(new Set(), null)}>
              <TrackColumn
                track="actual"
                placed={actual}
                ghosts={ideal}
                blocks={blocks}
                dragInfo={dragInfo}
                hoverInfo={hoverInfo}
                fmt={fmt}
                rowH={ROW_H}
                selection={selection}
                selectionTrack={selectionTrack}
                onSelectionChange={onSelectionChange}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragStartPlaced={handleDragStartPlaced}
                onDragEnd={onDragEnd}
                onRemovePlaced={onRemovePlaced}
                onResizeStart={handleResizeStart}
                onEditPlaced={onEditPlaced}
                justResized={justResized}
                getBlock={getBlock}
                noDragMode={noDragMode}
                picking={picking}
                onClickSlot={onClickSlot}
                onClickPlaced={onClickPlaced}
              />
            </div>
            {timeLine}
          </div>
        </div>
      </div>
    </div>
  )
}
