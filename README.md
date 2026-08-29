# Timeblocks

A day-planning app built around time blocking, plus a goal-decomposition tool to feed it. Design your ideal day, track how it actually goes, and compare the two side by side — then break big goals into subgoals you can drag straight onto the schedule.

The app has four tabs: **Focus** (what to do right now), **Schedule** (the time-blocking grid), **Tree** (goal trees), and **Rules** (a running note of rules you're holding yourself to).

## Focus

A near-full-screen view of whatever's happening right now — checks the Actual track first, falls back to the Ideal track if nothing's placed there, and shows nothing-scheduled if both are empty. Background and text color come straight from the block's own color. Includes the same Pomodoro timer as the Schedule sidebar (see below), laid out horizontally here instead of vertically. Below the timer there's a small italic motivational note — click it to edit.

## Schedule

Two parallel tracks — **Ideal** and **Actual** — let you plan your day in advance and log what really happened. Blocks are color-coded, resizable, and editable. Data persists locally and optionally syncs across devices via Google sign-in.

**Core features:**
- Drag-and-drop or tap-to-place blocks onto a 24-hour grid
- Ideal vs. Actual track comparison
- Block library with custom names, colors, and durations
- Templates — save and reapply full day layouts
- Brain Dump — a separate thought-capture list for distractions and stray ideas, accessible from the header and the Task & Distraction Panel in the sidebar
- Task & Distraction Panel — tabbed sidebar widget with Today's MVP, starred Goals from the Tree tab, and a quick distraction input
- Today's MVP has a 4th slot for a reward — write in something to look forward to once all 3 MVPs are checked off; it lights up green once unlocked
- Today's MVP and starred Goals are draggable straight onto the grid (spawns a block and places it)
- Pomodoro timer with optional page-fill visual (background fills up as the timer runs, then flashes when done) — one shared timer, visible from both the Schedule sidebar and the Focus tab; starting it in one place keeps it running and in sync in the other
- Color breakdown chart
- Undo / redo (Cmd+Z / Cmd+Shift+Z)
- Multi-block selection and drag (Shift+click)
- Keyboard shortcuts (Escape to deselect, Cmd+Enter to save in modals)
- Google sign-in + email/password auth with Firestore sync
- 30-minute blocks show only the block name and time, not the description

## Tree

Set a goal, then break it into the smaller steps that get you there. Each goal is a tree — a root bubble with subgoal bubbles branching below it, connected by lines — and multiple goal trees sit side by side on the same board. The board title ("YOUR GOALS" by default) is a plain editable field — type into it to rename it to whatever you want, like that week's theme.

**Features:**
- Recursive subgoals — any bubble can have its own subgoals, nested as deep as you need (no depth limit, including for signed-in Firestore sync)
- Checkbox to mark a bubble complete — dims the text and turns the border green
- Click the small date label in the corner of a completed bubble to set or backfill the date it was finished
- Insert a step between two connected bubbles — hover a bubble and click the "+" that appears above it
- Delete a bubble with subgoals underneath it — choose to delete just that bubble (its subgoals move up a level) or delete the whole branch, via a popup with number-key (1/2) and Escape shortcuts
- Star a subgoal to surface it in the Schedule tab's Goals tab, draggable onto the grid
- Recently Completed strip at the top — your latest finished subgoals across all goals, grouped by date
- Collapse/expand a goal, or archive it — archived goals move to a separate section out of the way and drop out of the Goals tab / Recently Completed feed
- Multiple goals, deletable individually

## Rules

A plain textbox for writing down the rules you're setting for yourself this month (or whatever timeframe you want) — no structure imposed, just a running note.

## Notifications

- Browser notification when the Pomodoro timer ends (fires even when tabbed away, requires permission) — works from either the Schedule or Focus tab, since it's the same shared timer
- Tab title flashes when timer is done

## Mobile

- Click-to-place mode on by default (tap a block, then tap a slot)
- Bottom block bar with tap-to-pick and double-tap-to-edit
- Move button on placed blocks
- Full settings and modal support

## Tech stack

- React 18
- Vite
- Firebase (Auth + Firestore)
- Pure CSS — no component libraries

## Getting started

```bash
npm install
npm run dev
```

Requires a Firebase project. Add your config to `src/firebase.js`.

## Build

```bash
npm run build
```

Deploy (personal-note)

```bash
npm run build && npm run deploy
```