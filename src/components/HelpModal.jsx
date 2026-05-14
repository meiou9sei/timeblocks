export default function HelpModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="help-modal">
        <div className="settings-modal-header">
          <span className="settings-modal-title">HOW IT WORKS</span>
          <button className="settings-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="help-body">
          <section className="help-section">
            <h3 className="help-section-title">About</h3>
            <p className="help-text">
              TIMEBLOCKS is a daily time-blocking planner. Build a schedule by dragging
              activity blocks onto a 24-hour grid. Compare your <em>ideal</em> day against
              what you <em>actually</em> did — side by side.
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">The Time Grid</h3>
            <ul className="help-list">
              <li><strong>IDEAL</strong> — plan your day before it starts.</li>
              <li><strong>ACTUAL</strong> — fill this in as the day unfolds. Ghost outlines show your ideal plan for reference.</li>
              <li>Drag a block from the palette on the right and drop it onto either track.</li>
              <li>Drag a placed block to move it. Drop it on the other track to copy it across.</li>
              <li>Drag the <strong>bottom edge</strong> of a placed block to resize it downward.</li>
              <li>Drag the <strong>top edge</strong> of a placed block to extend or shrink it upward.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Block Palette</h3>
            <ul className="help-list">
              <li>Click <strong>+ New Block</strong> to create a reusable activity block with a name, color, and default duration.</li>
              <li>Hover a palette block to reveal edit (✎) and delete (×) buttons.</li>
              <li>Drag palette blocks to reorder them.</li>
              <li>The <strong>Someday / Maybe</strong> list at the bottom lets you park tasks you might want to place later.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Schedule Builder  ▦</h3>
            <ul className="help-list">
              <li><strong>Gravity Drop</strong> — pick blocks and drop them sequentially from a start time.</li>
              <li><strong>Blueprint</strong> — define a repeating pattern (e.g. work / break / work) and tile it across the day.</li>
              <li><strong>Daily Intake</strong> — list today's tasks with time estimates and let the app auto-create and place them.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Other Features</h3>
            <ul className="help-list">
              <li><strong>Templates</strong> — save a track's layout and reapply it on future days.</li>
              <li><strong>Pomodoro timer</strong> — built-in focus timer in the left sidebar.</li>
              <li><strong>Minimap</strong> — thumbnail overview of the full 24-hour grid.</li>
              <li><strong>Procrastination Happy Hour</strong> <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: '1.1em', height: '1.1em', verticalAlign: 'text-bottom', display: 'inline', opacity: 0.75 }}><circle cx="4.5" cy="7" r="2.2" /><circle cx="8.5" cy="5.5" r="2.8" /><circle cx="12.5" cy="7" r="2.2" /><path d="M3 7h11v11a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 18V7z" /><path d="M14 9.5h1.5a2 2 0 0 1 0 4H14v-1.5h1.5a.5.5 0 0 0 0-1H14V9.5z" /></svg> — guilt-free task list; drag tasks onto the grid.</li>
              <li><strong>Color Breakdown</strong> — pie chart of time spent per block type.</li>
            </ul>
          </section>

          <div className="help-divider" />

          <section className="help-section">
            <h3 className="help-section-title">Keyboard Shortcuts</h3>
            <table className="help-keys">
              <tbody>
                <tr>
                  <td><kbd>Cmd / Ctrl</kbd> + <kbd>Z</kbd></td>
                  <td>Undo (up to 50 levels)</td>
                </tr>
                <tr>
                  <td><kbd>Cmd / Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></td>
                  <td>Redo</td>
                </tr>
                <tr>
                  <td><kbd>Cmd / Ctrl</kbd> + <kbd>Y</kbd></td>
                  <td>Redo (alternate)</td>
                </tr>
                <tr>
                  <td><kbd>Shift</kbd> + Click block</td>
                  <td>Multi-select placed blocks</td>
                </tr>
                <tr>
                  <td><kbd>Alt / Option</kbd> + Drag block</td>
                  <td>Duplicate a placed block</td>
                </tr>
                <tr>
                  <td><kbd>Escape</kbd></td>
                  <td>Deselect blocks / close modal</td>
                </tr>
              </tbody>
            </table>
          </section>
          <div className="help-divider" />

          <section className="help-section">
            <h3 className="help-section-title">Feedback & Bug Reports</h3>
            <p className="help-text">
              Have a suggestion, found a bug, or just want to say something?
              Reach out to <strong>Cameron</strong> — all feedback is welcome.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
