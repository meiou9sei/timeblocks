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
              TIMEBLOCKS is a daily time-blocking planner with four tabs: <strong>Focus</strong> (what to
              do right now), <strong>Schedule</strong> (the planning grid), <strong>Tree</strong> (break
              goals into subgoals), and <strong>Rules</strong> (a running note to yourself). Build a
              schedule by dragging activity blocks onto a 24-hour grid. Compare your <em>ideal</em> day
              against what you <em>actually</em> did — side by side.
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
            </ul>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Task & Distraction Panel</h3>
            <p className="help-text">
              A tabbed widget below the palette with three tabs — drag any item onto the grid to
              turn it into a placed block.
            </p>
            <ul className="help-list">
              <li><strong>Today's MVP</strong> — 3 things you must get done today, plus a 4th slot for a reward that unlocks (turns green) once all 3 are checked off. Drag a goal onto the grid.</li>
              <li><strong>Distractions</strong> — quick-add to your Brain Dump list without leaving the grid.</li>
              <li><strong>Goals</strong> — subgoals you've starred on the Tree tab, ready to schedule.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Focus Tab</h3>
            <p className="help-text">
              A near-full-screen view of whatever's happening right now. Checks the Actual track first,
              falls back to Ideal if nothing's placed there — background and text color come from that
              block's own color. Includes the same Pomodoro timer as the Schedule sidebar (see below),
              just laid out horizontally. Click the italic line under the timer to write yourself a
              motivational note.
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Tree Tab</h3>
            <p className="help-text">
              Set a goal, then break it into the smaller steps that get you there. Each goal is a tree —
              a root bubble with subgoal bubbles branching below it — and multiple goals sit side by side.
            </p>
            <ul className="help-list">
              <li>Click <strong>+ New Goal</strong> to start a tree, then <strong>+</strong> on any bubble to add a subgoal underneath it.</li>
              <li>Hover a bubble and click the <strong>+</strong> that appears above it to insert a step between it and its parent.</li>
              <li>Check a bubble off to mark it complete — click the date label in its corner to set or backfill when it was finished.</li>
              <li>Star a subgoal (★) to surface it in the Schedule tab's Goals tab, ready to drag onto the grid.</li>
              <li>Deleting a bubble with subgoals underneath asks whether to keep them (they move up a level) or delete the whole branch.</li>
              <li>Collapse (▾/▸) or archive (▤) a goal to tuck it out of the way — archived goals drop out of the Goals tab and Recently Completed feed.</li>
              <li>Click the board title ("YOUR GOALS") to rename it to anything — a weekly theme, for example.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Rules Tab</h3>
            <p className="help-text">
              A plain textbox for writing down the rules you're holding yourself to this month —
              no structure, just a running note.
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Other Features</h3>
            <ul className="help-list">
              <li><strong>Templates</strong> — save a track's layout and reapply it on future days.</li>
              <li><strong>Pomodoro timer</strong> — one shared timer, visible from both the Schedule sidebar and the Focus tab.</li>
              <li><strong>Minimap</strong> — thumbnail overview of the full 24-hour grid.</li>
              <li><strong>Color Breakdown</strong> — pie chart of time spent per block type.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">Touch / Click-to-Place Mode</h3>
            <p className="help-text">
              On mobile, blocks are placed by tapping rather than dragging. This mode can also be enabled on desktop via Settings → Interaction.
            </p>
            <ul className="help-list">
              <li>Tap a block in the bar at the bottom to select it — it will highlight.</li>
              <li>Tap any slot on the grid to place it there.</li>
              <li>Tap the same block again in the bar to deselect it, or tap <strong>✕ Cancel</strong> in the banner.</li>
              <li>To move a placed block, tap it to reveal buttons, then tap the <strong>↕ move button</strong> and tap a new slot.</li>
              <li>To edit a placed block, tap it to reveal buttons, then tap <strong>✎</strong>.</li>
              <li>Double-tap a block in the bottom bar to edit its name, color, and duration.</li>
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
