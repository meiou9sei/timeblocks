# Timeblocks

A day-planning app built around time blocking. Design your ideal day, track how it actually goes, and compare the two side by side.

## What it does

Two parallel tracks — **Ideal** and **Actual** — let you plan your day in advance and log what really happened. Blocks are color-coded, resizable, and editable. Data persists locally and optionally syncs across devices via Google sign-in.

**Core features:**
- Drag-and-drop or tap-to-place blocks onto a 24-hour grid
- Ideal vs. Actual track comparison
- Block library with custom names, colors, and durations
- Schedule Builder — auto-fills your day from a block list
- Templates — save and reapply full day layouts
- Procrastination Happy Hour — a side list of tasks you've been avoiding, draggable onto the grid
- Brain Dump — a separate thought-capture list for distractions and stray ideas, accessible from the header and the Task & Distraction Panel in the sidebar
- Task & Distraction Panel — tabbed sidebar widget with Someday Maybe task suggestions (from Happy Hour) and a quick distraction input
- Pomodoro timer with optional page-fill visual: background fills up as the timer runs, then flashes when done
- Color breakdown chart
- Undo / redo (Cmd+Z / Cmd+Shift+Z)
- Multi-block selection and drag (Shift+click)
- Keyboard shortcuts (Escape to deselect, Cmd+Enter to save in modals)
- Google sign-in + email/password auth with Firestore sync
- 30-minute blocks show only the block name and time, not the description

**Notifications:**
- Browser notification when Pomodoro timer ends (fires even when tabbed away, requires permission)
- Tab title flashes when timer is done

**Mobile:**
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