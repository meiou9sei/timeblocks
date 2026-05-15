import { useEffect, useRef, useState } from 'react'

function isDark(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h12 = i % 12 || 12
  const ampm = i < 12 ? 'AM' : 'PM'
  return { slot: i * 2, label: `${h12}:00 ${ampm}` }
})

const THEMES = [
  { id: 'dark',     label: 'Dark',    bg: '#0c0c14', card: '#12121e', accent: '#00e5ff' },
  { id: 'midnight', label: 'Night',    bg: '#000005', card: '#0a0a12', accent: '#7c3aed' },
  { id: 'light',    label: 'Light',   bg: '#f0f0f5', card: '#ffffff', accent: '#2563eb' },
  { id: 'forest',   label: 'Forest',  bg: '#0a130a', card: '#111a11', accent: '#4ade80' },
  { id: 'sakura',   label: 'Sakura',  bg: '#12080e', card: '#1e0e18', accent: '#f472b6' },
  { id: 'crimson',  label: 'Crimson', bg: '#0f0507', card: '#1a0a0d', accent: '#e02040' },
  { id: 'ember',    label: 'Ember',   bg: '#0f0800', card: '#1a1000', accent: '#ff6b1a' },
  { id: 'ocean',    label: 'Ocean',   bg: '#020d18', card: '#061525', accent: '#00b4d8' },
  { id: 'dusk',     label: 'Dusk',    bg: '#0d0a1a', card: '#161028', accent: '#f0a030' },
  { id: 'slate',    label: 'Slate',   bg: '#0a0d12', card: '#10151e', accent: '#94b8d8' },
  { id: 'abyss',    label: 'Midnight', bg: '#000000', card: '#080808', accent: '#ffffff' },
  { id: 'gameboy',  label: 'Game Boy', bg: '#0f1a0f', card: '#162616', accent: '#9bbc0f' },
  { id: 'phosphor', label: 'Phosphor', bg: '#000000', card: '#020602', accent: '#33ff33' },
  { id: 'apple',      label: 'Apple',     bg: '#000000', card: '#1c1c1e', accent: '#0a84ff' },
  { id: 'wikipedia',    label: 'Wikipedia',   bg: '#f8f9fa', card: '#ffffff', accent: '#3366cc' },
  { id: 'drunk',        label: 'Drunk',       bg: '#1a0528', card: '#2d0a3e', accent: '#ff1a8c' },
]

export default function SettingsModal({ settings, onChange, onClearDay, onExport, onImport, onReset, onClose }) {
  const [confirmTrack, setConfirmTrack] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const importInputRef = useRef(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(key, value) {
    onChange({ ...settings, [key]: value })
  }

  function handleClear(track) {
    if (confirmTrack !== track) { setConfirmTrack(track); return }
    onClearDay(track)
    setConfirmTrack(null)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <span className="settings-modal-title">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: '0.9em', height: '0.9em', verticalAlign: 'text-bottom', marginRight: '0.4em' }}>
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
            SETTINGS
          </span>
          <button className="settings-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-modal-body">
        {/* Theme */}
        <div className="settings-row" style={{ gridColumn: '1 / -1' }}>
          <label className="settings-label">Theme</label>
          <div className="theme-grid">
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`theme-tile ${settings.theme === t.id ? 'theme-tile--active' : ''}`}
                style={{ borderColor: settings.theme === t.id ? t.accent : 'transparent' }}
                onClick={() => set('theme', t.id)}
                title={t.label}
              >
                <div className="theme-tile-preview" style={{ background: t.bg }}>
                  <div className="theme-tile-stripe" style={{ background: t.accent }} />
                </div>
                <div className="theme-tile-label" style={{ background: t.card, color: settings.theme === t.id ? t.accent : (isDark(t.card) ? '#aaaaaa' : '#444444') }}>
                  {t.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* No-drag mode */}
        <div className="settings-row" style={{ gridColumn: '1 / -1' }}>
          <label className="settings-label">Interaction</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${!settings.noDragMode ? 'toggle-btn--active' : ''}`}
              onClick={() => set('noDragMode', false)}
            >Drag & drop</button>
            <button
              className={`toggle-btn ${settings.noDragMode ? 'toggle-btn--active' : ''}`}
              onClick={() => set('noDragMode', true)}
            >Tap to place</button>
          </div>
          <p className="settings-hint">
            <strong>Drag & drop</strong> — drag a block from the palette onto the grid. Default on desktop.{' '}
            <strong>Tap to place</strong> — tap a block to select it, then tap a slot on the grid to place it. Default on mobile.
          </p>
        </div>

        {/* Time format */}
        <div className="settings-row">
          <label className="settings-label">Time format</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${settings.timeFormat === '12h' ? 'toggle-btn--active' : ''}`}
              onClick={() => set('timeFormat', '12h')}
            >12h AM/PM</button>
            <button
              className={`toggle-btn ${settings.timeFormat === '24h' ? 'toggle-btn--active' : ''}`}
              onClick={() => set('timeFormat', '24h')}
            >24h</button>
          </div>
        </div>

        {/* Density */}
        <div className="settings-row">
          <label className="settings-label">View density</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${(settings.density ?? 'normal') === 'normal' ? 'toggle-btn--active' : ''}`}
              onClick={() => set('density', 'normal')}
            >Spacious</button>
            <button
              className={`toggle-btn ${settings.density === 'compact' ? 'toggle-btn--active' : ''}`}
              onClick={() => set('density', 'compact')}
            >Compact</button>
          </div>
        </div>

        {/* Start time */}
        <div className="settings-row">
          <label className="settings-label">Default start time</label>
          <select
            className="create-select"
            value={settings.startSlot}
            onChange={(e) => set('startSlot', Number(e.target.value))}
          >
            {HOUR_OPTIONS.map(o => (
              <option key={o.slot} value={o.slot}>{o.label}</option>
            ))}
          </select>
          <p className="settings-hint">The timeline scrolls here on load.</p>
        </div>

        {/* Clear */}
        <div className="settings-row">
          <label className="settings-label">Clear schedule</label>
          <div className="clear-btn-row">
            {['ideal', 'actual', 'both'].map(track => (
              <button
                key={track}
                className={`clear-btn ${confirmTrack === track ? 'clear-btn--confirm' : ''}`}
                onClick={() => handleClear(track)}
              >
                {confirmTrack === track
                  ? 'Confirm?'
                  : track.charAt(0).toUpperCase() + track.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Pomodoro duration */}
        <div className="settings-row">
          <label className="settings-label">Pomodoro length</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              className="create-input"
              min={1}
              max={180}
              style={{ width: '70px' }}
              value={settings.pomodoroMinutes ?? 25}
              onChange={e => {
                const v = Math.max(1, Math.min(180, Number(e.target.value)))
                if (!isNaN(v)) set('pomodoroMinutes', v)
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>minutes</span>
          </div>
        </div>

        {/* Widget visibility */}
        <div className="settings-row" style={{ gridColumn: '1 / -1' }}>
          <label className="settings-label">Show widgets</label>
          <div className="toggle-group" style={{ flexWrap: 'wrap' }}>
            {[
              ['showMinimap',      'Minimap'],
              ['showPomodoro',     'Pomodoro'],
              ['showColorChart',   'Color Chart'],
              ['showSomedayMaybe', 'Someday Maybe'],
              ['showQuotes',       'Quotes'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`toggle-btn ${settings[key] !== false ? 'toggle-btn--active' : ''}`}
                onClick={() => set(key, settings[key] === false)}
              >{label}</button>
            ))}
          </div>
          <p className="settings-hint">Click to show or hide each widget.</p>
        </div>

        {/* Import / Export */}
        <div className="settings-row" style={{ gridColumn: '1 / -1' }}>
          <label className="settings-label">Backup & restore</label>
          <div className="toggle-group">
            <button className="toggle-btn" onClick={onExport}>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: '0.85em', height: '0.85em', verticalAlign: 'text-bottom', marginRight: '0.3em' }}>
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Export
            </button>
            <button className="toggle-btn" onClick={() => importInputRef.current.click()}>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: '0.85em', height: '0.85em', verticalAlign: 'text-bottom', marginRight: '0.3em' }}>
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) { onImport(e.target.files[0]); e.target.value = '' } }}
            />
          </div>
          <p className="settings-hint">Export saves all blocks, schedule, templates & happy hour tasks.</p>
        </div>

        {/* Reset */}
        <div className="settings-row" style={{ gridColumn: '1 / -1' }}>
          <label className="settings-label">Danger zone</label>
          <div>
            <button
              className={`clear-btn ${confirmReset ? 'clear-btn--confirm' : ''}`}
              onClick={() => {
                if (!confirmReset) { setConfirmReset(true); return }
                onReset()
                onClose()
              }}
            >
              ☢ {confirmReset ? 'Confirm? This cannot be undone' : 'Reset to defaults'}
            </button>
          </div>
          <p className="settings-hint">Clears all blocks, schedules, templates & tasks. Resets settings.</p>
        </div>
        </div>
      </div>
    </div>
  )
}
