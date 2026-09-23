# Timeblocks

A day-planning app built around time blocking, plus a goal-decomposition tool to feed it. Design your ideal day, track how it actually goes, and compare the two side by side — then break big goals into subgoals you can drag straight onto the schedule.

The app has six tabs: **Focus** (what to do right now), **Schedule** (the time-blocking grid), **Brain Dump** (a thought-capture list), **Tree** (goal trees), **Gears** (daily minimum-effort habit tracking), and **Rules** (a running note of rules you're holding yourself to).

## Focus

A near-full-screen view of whatever's happening right now — checks the Actual track first, falls back to the Ideal track if nothing's placed there, and shows nothing-scheduled if both are empty. Background and text color come straight from the block's own color. Includes the same Pomodoro timer as the Schedule sidebar (see below), laid out horizontally here instead of vertically. Below the timer there's a small italic motivational note — click it to edit. There's also a quick-capture input for stray distractions, which land in the Brain Dump tab.

## Schedule

Two parallel tracks — **Ideal** and **Actual** — let you plan your day in advance and log what really happened. Blocks are color-coded, resizable, and editable. Data persists locally and optionally syncs across devices via Google sign-in.

**Core features:**
- Drag-and-drop or tap-to-place blocks onto a 24-hour grid
- Ideal vs. Actual track comparison
- Block library with custom names, colors, and durations
- Templates — save and reapply full day layouts
- Task & Distraction Panel — tabbed sidebar widget with Today's MVP and starred Goals from the Tree tab
- Today's MVP has a 4th slot for a reward — write in something to look forward to once all 3 MVPs are checked off; it lights up green once unlocked
- Today's MVP and starred Goals are draggable straight onto the grid (spawns a block and places it)
- Pomodoro timer with optional page-fill visual (background fills up as the timer runs, then flashes when done) — one shared timer, visible from both the Schedule sidebar and the Focus tab; starting it in one place keeps it running and in sync in the other
- Color breakdown chart
- Undo / redo (Cmd+Z / Cmd+Shift+Z)
- Multi-block selection: Cmd/Ctrl+click to toggle blocks individually, Shift+click to select every block between the last-clicked one and the new click — chain more Shift+clicks to keep extending the selection
- Spotlight Mode — a toggle (lightbulb icon in the tab bar) that grays every block to one flat color except ones marked "keep color" in their edit modal, so you can see one thing at a time
- Keyboard shortcuts (Escape to deselect, Cmd+Enter to save in modals)
- Google sign-in + email/password auth with Firestore sync
- 30-minute blocks show only the block name and time, not the description

## Brain Dump

A running list for whatever's rattling around in your head — stray thoughts, distractions, things to deal with later. Add items from its own tab or from the quick-capture input on the Focus tab. Check items off, edit them in place (double-click), drag to reorder, and clear everything you've checked off in one go.

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

## Gears

A "no zero days" habit tracker, based on the idea of gears: define a few daily fields (e.g. Read, Run, Edit video), and for each one set what counts as Gear 1 through Gear 4 — Gear 1 being the bare-minimum version of the habit, Gear 4 being the ambitious version. Every day, tap the gear you actually hit for each field.

**Features:**
- Configure your own fields and what each of the 4 gears means per field, right from the tab
- Each field shows a pip gauge for today plus a tap-to-expand carousel — the current gear sits centered with its neighbors visible on either side, and switching gears slides the strip over with a quick gear-shift-style animation
- The day rolls over at 4am, not midnight, so staying up late still logs against the day that's ending
- Date nav to page back through past days and log or fix earlier entries
- Each field's box tints red/green/blue/purple to match its gear level for today, at a glance
- A heatmap at the bottom shows the last 35 days per field (red = missed, green → cyan → blue → purple = Gear 1 → 4), plus an "Overall" row showing the *minimum* gear reached across all fields that day — useful if your rule is "no Gear 2s until every field has hit Gear 1"
- Each field has a "Since" start date (defaults to when you created it) so days before it existed aren't marked as missed in the heatmap
- Synced via the same Firestore backend as the rest of the app

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