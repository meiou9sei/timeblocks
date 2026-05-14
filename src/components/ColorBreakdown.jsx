import { useState, useMemo } from 'react'

function buildSlices(placed, getBlock) {
  const totals = {}
  for (const p of placed) {
    const block = getBlock(p.blockId)
    if (!block) continue
    const key = block.color
    if (!totals[key]) totals[key] = { color: block.color, name: block.name, slots: 0 }
    totals[key].slots += p.duration
  }
  return Object.values(totals).sort((a, b) => b.slots - a.slots)
}

// For actual: walk each half-hour slot, prefer an actual block if present,
// otherwise fall back to whatever ideal block covers that slot.
function buildMergedSlices(ideal, actual, getBlock) {
  // Build a slot-indexed map for actual
  const actualMap = new Array(48).fill(null)
  for (const p of actual) {
    for (let s = p.startSlot; s < p.startSlot + p.duration; s++) {
      if (s < 48) actualMap[s] = p.blockId
    }
  }
  // Build a slot-indexed map for ideal
  const idealMap = new Array(48).fill(null)
  for (const p of ideal) {
    for (let s = p.startSlot; s < p.startSlot + p.duration; s++) {
      if (s < 48) idealMap[s] = p.blockId
    }
  }

  const totals = {}
  for (let s = 0; s < 48; s++) {
    const blockId = actualMap[s] ?? idealMap[s]
    if (!blockId) continue
    const block = getBlock(blockId)
    if (!block) continue
    const key = block.color
    if (!totals[key]) totals[key] = { color: block.color, name: block.name, slots: 0 }
    totals[key].slots += 1
  }
  return Object.values(totals).sort((a, b) => b.slots - a.slots)
}

function DonutChart({ slices, total, size = 46 }) {
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 4
  const circumference = 2 * Math.PI * r

  let offset = 0
  const paths = slices.map(s => {
    const pct  = s.slots / total
    const dash = pct * circumference
    const path = (
      <circle
        key={s.color}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={s.color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    )
    offset += dash
    return path
  })

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-deep)" strokeWidth={8} />
      {paths}
    </svg>
  )
}

export default function ColorBreakdown({ ideal, actual, getBlock }) {
  const [track, setTrack] = useState('actual')

  const slices = useMemo(
    () => track === 'ideal'
      ? buildSlices(ideal, getBlock)
      : buildMergedSlices(ideal, actual, getBlock),
    [track, ideal, actual, getBlock]
  )
  const total = slices.reduce((s, x) => s + x.slots, 0)

  if (total === 0) return null

  return (
    <div className="color-breakdown">
      <div className="color-breakdown-toggle">
        <button
          className={`cb-toggle-btn${track === 'ideal' ? ' active' : ''}`}
          onClick={() => setTrack('ideal')}
        >I</button>
        <button
          className={`cb-toggle-btn${track === 'actual' ? ' active' : ''}`}
          onClick={() => setTrack('actual')}
        >A</button>
      </div>

      <DonutChart slices={slices} total={total} />

      <div className="color-breakdown-legend">
        {slices.map(s => {
          const pct = Math.round((s.slots / total) * 100)
          const hrs = (s.slots * 0.5).toFixed(1)
          return (
            <div key={s.color} className="cb-legend-row" title={`${s.name}: ${hrs}h (${pct}%)`}>
              <span className="cb-swatch" style={{ background: s.color }} />
              <span className="cb-pct">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
