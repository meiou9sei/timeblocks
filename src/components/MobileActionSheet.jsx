export default function MobileActionSheet({ placed, track, block, onEdit, onMove, onRemove, onClose }) {
  return (
    <div className="mobile-sheet-backdrop" onClick={onClose}>
      <div className="mobile-sheet" onClick={e => e.stopPropagation()}>
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-header">
          <div className="mobile-sheet-dot" style={{ background: block.color }} />
          <span className="mobile-sheet-title">{block.name}</span>
          <span className="mobile-sheet-track">{track === 'ideal' ? 'Ideal' : 'Actual'}</span>
        </div>
        <div className="mobile-sheet-actions">
          <button className="mobile-sheet-btn" onClick={onEdit}>✎ Edit</button>
          <button className="mobile-sheet-btn" onClick={onMove}>↕ Move</button>
          <button className="mobile-sheet-btn mobile-sheet-btn--danger" onClick={onRemove}>× Remove</button>
        </div>
        <button className="mobile-sheet-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
