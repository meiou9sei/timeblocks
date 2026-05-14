import { useState, useEffect, useRef } from 'react'

const SLOT_COUNT = 48
const MINI_ROW_H = 5 // px per slot → 240px total
const TOTAL_H = SLOT_COUNT * MINI_ROW_H

export default function Minimap({ ideal, actual, blocks, getBlock, scrollRef }) {
  const [indicator, setIndicator] = useState({ top: 0, height: 0 })
  const bodyRef = useRef(null)
  const dragging = useRef(false)

  // Track scroll position to update viewport indicator
  useEffect(() => {
    const el = scrollRef?.current
    if (!el) return

    function update() {
      const visibleH = el.clientHeight
      const totalH   = el.scrollHeight
      const top      = (el.scrollTop / totalH) * TOTAL_H
      const height   = (visibleH / totalH) * TOTAL_H
      setIndicator({ top, height })
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [scrollRef])

  function scrollTo(clientY) {
    const el = scrollRef?.current
    if (!el || !bodyRef.current) return
    const rect = bodyRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / TOTAL_H))
    el.scrollTop = ratio * el.scrollHeight
  }

  function handleMouseDown(e) {
    e.preventDefault()
    dragging.current = true
    scrollTo(e.clientY)

    function onMove(ev) { if (dragging.current) scrollTo(ev.clientY) }
    function onUp()     { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="minimap">
      <div className="minimap-track-headers">
        <span>I</span>
        <span>A</span>
      </div>

      <div className="minimap-body" ref={bodyRef} onMouseDown={handleMouseDown}>
        {/* Hour grid lines */}
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className="minimap-hour-line" style={{ top: i * 2 * MINI_ROW_H }} />
        ))}

        {/* Ideal track */}
        <div className="minimap-track minimap-track--ideal">
          {ideal.map(p => {
            const block = getBlock(p.blockId)
            if (!block) return null
            return (
              <div
                key={p.id}
                className="minimap-block"
                style={{
                  top:    p.startSlot * MINI_ROW_H,
                  height: Math.max(2, p.duration * MINI_ROW_H - 1),
                  background: block.color,
                }}
              />
            )
          })}
        </div>

        {/* Actual track */}
        <div className="minimap-track minimap-track--actual">
          {actual.map(p => {
            const block = getBlock(p.blockId)
            if (!block) return null
            return (
              <div
                key={p.id}
                className="minimap-block"
                style={{
                  top:    p.startSlot * MINI_ROW_H,
                  height: Math.max(2, p.duration * MINI_ROW_H - 1),
                  background: block.color,
                }}
              />
            )
          })}
        </div>

        {/* Viewport indicator */}
        <div
          className="minimap-viewport"
          style={{ top: indicator.top, height: indicator.height }}
        />
      </div>
    </div>
  )
}
