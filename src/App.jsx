import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, auth, googleProvider } from './firebase.js'
import TimeGrid from './components/TimeGrid.jsx'
import BlockPalette from './components/BlockPalette.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import Minimap from './components/Minimap.jsx'
import ColorBreakdown from './components/ColorBreakdown.jsx'
import PomodoroTimer from './components/PomodoroTimer.jsx'
import DistractionsModal from './components/DistractionsModal.jsx'
import TemplatesModal from './components/TemplatesModal.jsx'
import PlacedBlockEditModal from './components/PlacedBlockEditModal.jsx'
import HelpModal from './components/HelpModal.jsx'
import AuthModal from './components/AuthModal.jsx'
import MobileBlockBar from './components/MobileBlockBar.jsx'
import GoalTreeView from './components/GoalTreeView.jsx'
import { makeTree, updateNodeText, setNodeDone, toggleNodeStar, insertNodeAbove, addChildNode, removeNode, collectStarred } from './utils/tree.js'
import './styles/base.css'
import './styles/layout.css'
import './styles/grid.css'
import './styles/blocks.css'
import './styles/palette.css'
import './styles/modals.css'
import './styles/minimap.css'
import './styles/pomodoro.css'
import './styles/procrast.css'
import './styles/templates.css'
import './styles/tree.css'
import './styles/mobile.css'


const uid = () => Math.random().toString(36).slice(2)
const ADHOC_COLOR = '#a78bfa'
const ADHOC_DURATION = 2

const DEFAULT_BLOCKS = [
  { id: 'b1', name: 'Deep Work',   color: '#00e5ff', duration: 4 },
  { id: 'b2', name: 'Exercise',    color: '#4ade80', duration: 2 },
  { id: 'b3', name: 'Lunch',       color: '#f9e040', duration: 2 },
  { id: 'b4', name: 'Meeting',     color: '#a855f7', duration: 2 },
  { id: 'b5', name: 'Break',       color: '#f97316', duration: 1 },
  { id: 'b6', name: 'Email/Admin', color: '#ef4444', duration: 2 },
  { id: 'b7', name: 'Planning',    color: '#3b82f6', duration: 2 },
]

const DEFAULT_SETTINGS = { startSlot: 14, theme: 'dark', timeFormat: '12h', density: 'normal', showMinimap: true, showPomodoro: true, showSomedayMaybe: true, showQuotes: true }

function load(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val !== null ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function defaultMvp() {
  return { date: todayStr(), goals: [{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }] }
}

export default function App() {
  const [blocks,   setBlocks]   = useState(() => load('tb-blocks',   DEFAULT_BLOCKS))
  const [ideal,    setIdeal]    = useState(() => load('tb-ideal',    []))
  const [actual,   setActual]   = useState(() => load('tb-actual',   []))
  const [settings, setSettings] = useState(() => {
    const saved = load('tb-settings', null)
    const base = saved ?? DEFAULT_SETTINGS
    if (base.noDragMode === undefined && window.matchMedia('(max-width: 640px)').matches) {
      return { ...base, noDragMode: true }
    }
    return base
  })
  const [dragInfo, setDragInfo] = useState(null)
  const [picking, setPicking] = useState(null) // { blockId, duration, movingPlacedId?, movingTrack? } — used in no-drag mode
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showDistractions, setShowDistractions] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingPlaced, setEditingPlaced] = useState(null) // { placed, track }
  const [distractions,  setDistractions]  = useState(() => load('tb-distractions', []))
  const [mvp, setMvp] = useState(() => {
    const saved = load('tb-mvp', null)
    return saved && saved.date === todayStr() ? saved : defaultMvp()
  })
  const [templates, setTemplates] = useState(() => load('tb-templates', []))
  const [trees, setTrees] = useState(() => load('tb-trees', []))
  const [activeView, setActiveView] = useState(() => load('tb-active-view', 'schedule'))
  const [selection, setSelection] = useState(new Set())
  const [selectionTrack, setSelectionTrack] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [user, setUser] = useState(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [pomoState, setPomoState] = useState({ phase: 'idle', progress: 0 })
  const [showMobileHint, setShowMobileHint] = useState(
    () => window.matchMedia('(max-width: 640px)').matches && !load('tb-mobile-hint-dismissed', false)
  )
  const [showHelpHint, setShowHelpHint] = useState(() => !load('tb-help-hint-dismissed', false))
  const [showPickingTip, setShowPickingTip] = useState(() => !load('tb-picking-tip-dismissed', false))

  function dismissHelpHint() {
    localStorage.setItem('tb-help-hint-dismissed', 'true')
    setShowHelpHint(false)
  }

  function dismissPickingTip() {
    localStorage.setItem('tb-picking-tip-dismissed', 'true')
    setShowPickingTip(false)
  }

  const gridScrollRef = useRef(null)
  const saveTimerRef = useRef(null)
  const initialSnapshotRef = useRef(false)
  const skipNextSaveRef = useRef(false)

  // ── Undo / Redo history ───────────────────────────────────────────────────
  const historyRef   = useRef([])
  const redoRef      = useRef([])
  const undoRedoRef  = useRef(null) // 'undo' | 'redo' | null
  const prevTrackRef = useRef(null)
  const isResizingRef  = useRef(false)
  const preResizeRef   = useRef(null)
  const latestTrackRef = useRef(null)

  useEffect(() => {
    latestTrackRef.current = { ideal, actual }
    if (prevTrackRef.current === null) {
      prevTrackRef.current = { ideal, actual }
      return
    }
    if (undoRedoRef.current) {
      undoRedoRef.current = null
      prevTrackRef.current = { ideal, actual }
      return
    }
    if (isResizingRef.current) return
    // Regular change: push old state to history, clear redo stack
    historyRef.current = [...historyRef.current.slice(-49), prevTrackRef.current]
    redoRef.current = []
    prevTrackRef.current = { ideal, actual }
  }, [ideal, actual])

  const handleResizeBegin = useCallback(() => {
    isResizingRef.current = true
    preResizeRef.current = prevTrackRef.current
  }, [])

  const handleResizeCommit = useCallback(() => {
    if (!isResizingRef.current) return
    isResizingRef.current = false
    if (preResizeRef.current) {
      historyRef.current = [...historyRef.current.slice(-49), preResizeRef.current]
      redoRef.current = []
      prevTrackRef.current = latestTrackRef.current
      preResizeRef.current = null
    }
  }, [])

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return
    const prev = historyRef.current[historyRef.current.length - 1]
    historyRef.current = historyRef.current.slice(0, -1)
    redoRef.current = [...redoRef.current, prevTrackRef.current]
    undoRedoRef.current = 'undo'
    setIdeal(prev.ideal)
    setActual(prev.actual)
  }, [])

  const handleRedo = useCallback(() => {
    if (redoRef.current.length === 0) return
    const next = redoRef.current[redoRef.current.length - 1]
    redoRef.current = redoRef.current.slice(0, -1)
    historyRef.current = [...historyRef.current, prevTrackRef.current]
    undoRedoRef.current = 'redo'
    setIdeal(next.ideal)
    setActual(next.actual)
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleUndo, handleRedo])

  useEffect(() => {
    let unsubSnapshot = null

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubSnapshot) { unsubSnapshot(); unsubSnapshot = null }

      if (firebaseUser) {
        setUser(firebaseUser)
        initialSnapshotRef.current = false
        const docRef = doc(db, 'users', firebaseUser.uid)
        unsubSnapshot = onSnapshot(docRef, (snap) => {
          // First snapshot: always apply (initial load)
          if (!initialSnapshotRef.current) {
            initialSnapshotRef.current = true
            if (snap.exists()) {
              const d = snap.data()
              skipNextSaveRef.current = true
              if (d.blocks)        setBlocks(d.blocks)
              if (d.ideal)         setIdeal(d.ideal)
              if (d.actual)        setActual(d.actual)
              if (d.settings)      setSettings(prev => ({ ...d.settings, noDragMode: prev.noDragMode }))
              if (d.templates)     setTemplates(d.templates)
              if (d.trees)         setTrees(d.trees)
              if (d.distractions)  setDistractions(d.distractions)
              if (d.mvp && d.mvp.date === todayStr()) setMvp(d.mvp)
            }
            return
          }
          // Subsequent snapshots: skip echoes of our own local writes
          if (snap.metadata.hasPendingWrites) return
          if (snap.exists()) {
            const d = snap.data()
            skipNextSaveRef.current = true
            if (d.blocks)        setBlocks(d.blocks)
            if (d.ideal)         setIdeal(d.ideal)
            if (d.actual)        setActual(d.actual)
            if (d.settings)      setSettings(prev => ({ ...d.settings, noDragMode: prev.noDragMode }))
            if (d.templates)     setTemplates(d.templates)
            if (d.trees)         setTrees(d.trees)
            if (d.distractions)  setDistractions(d.distractions)
            if (d.mvp && d.mvp.date === todayStr()) setMvp(d.mvp)
          }
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      unsubAuth()
      if (unsubSnapshot) unsubSnapshot()
    }
  }, [])

  // Debounced Firestore save
  useEffect(() => {
    if (!user) return
    if (!initialSnapshotRef.current) return   // don't save before first snapshot lands
    if (skipNextSaveRef.current) { skipNextSaveRef.current = false; return }  // remote update, not a local change
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const { noDragMode: _local, ...syncedSettings } = settings
      setDoc(doc(db, 'users', user.uid), { blocks, ideal, actual, settings: syncedSettings, templates, trees, distractions, mvp })
    }, 800)
  }, [blocks, ideal, actual, settings, templates, trees, distractions, mvp, user])

  // Hard-delete soft-deleted blocks that no longer have any placements
  useEffect(() => {
    const placedIds = new Set([...ideal, ...actual].map(p => p.blockId))
    setBlocks(prev => {
      const next = prev.filter(b => !b.deleted || placedIds.has(b.id))
      return next.length === prev.length ? prev : next
    })
  }, [blocks, ideal, actual])

  const handleSignIn  = useCallback(() => signInWithPopup(auth, googleProvider), [])
  const handleSignOut = useCallback(() => signOut(auth), [])

  function dismissMobileHint() {
    localStorage.setItem('tb-mobile-hint-dismissed', 'true')
    setShowMobileHint(false)
  }


  useEffect(() => { localStorage.setItem('tb-blocks',   JSON.stringify(blocks))   }, [blocks])
  useEffect(() => { localStorage.setItem('tb-ideal',    JSON.stringify(ideal))    }, [ideal])
  useEffect(() => { localStorage.setItem('tb-actual',   JSON.stringify(actual))   }, [actual])
  useEffect(() => { localStorage.setItem('tb-settings', JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem('tb-distractions',   JSON.stringify(distractions))  }, [distractions])
  useEffect(() => { localStorage.setItem('tb-mvp',            JSON.stringify(mvp))            }, [mvp])
  useEffect(() => { localStorage.setItem('tb-templates',  JSON.stringify(templates))     }, [templates])
  useEffect(() => { localStorage.setItem('tb-trees',          JSON.stringify(trees))          }, [trees])
  useEffect(() => { localStorage.setItem('tb-active-view',    JSON.stringify(activeView))     }, [activeView])
  useEffect(() => { document.documentElement.setAttribute('data-theme', settings.theme ?? 'dark') }, [settings.theme])
  useEffect(() => { document.documentElement.setAttribute('data-density', settings.density ?? 'normal') }, [settings.density])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return
      if (editingPlaced)      { setEditingPlaced(null);          return }
      if (showHelp)           { setShowHelp(false);              return }
      if (showTemplates)      { setShowTemplates(false);         return }
      if (showDistractions)   { setShowDistractions(false);      return }
      if (showSettings)       { setShowSettings(false);          return }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editingPlaced, showHelp, showTemplates, showDistractions, showSettings])

  useEffect(() => {
    if (!showUserMenu) return
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  const getBlock = useCallback((blockId) => blocks.find(b => b.id === blockId), [blocks])

  const isOccupied = useCallback((startSlot, duration, track, excludeId = null) => {
    const arr = track === 'ideal' ? ideal : actual
    for (const p of arr) {
      if (p.id === excludeId) continue
      if (startSlot < p.startSlot + p.duration && startSlot + duration > p.startSlot) return true
    }
    return false
  }, [ideal, actual])

  useEffect(() => {
    if (!settings.noDragMode) setPicking(null)
  }, [settings.noDragMode])

  const handlePick = useCallback((p) => setPicking(p), [])

  const handleAdhocDragStart = useCallback((taskText) => {
    setDragInfo({ source: 'adhoc', taskText, placedDuration: ADHOC_DURATION })
  }, [])

  const handleAdhocPick = useCallback((taskText) => {
    setPicking(prev => prev?.adhocText === taskText ? null : { adhocText: taskText, duration: ADHOC_DURATION })
  }, [])

  const handleClickSlot = useCallback((slot, track) => {
    if (!picking) return
    const { blockId, duration, movingPlacedId, movingTrack, adhocText } = picking
    const startSlot = Math.min(Math.max(0, slot), 48 - duration)
    if (adhocText) {
      if (isOccupied(startSlot, duration, track, null)) return
      const newBlockId = uid()
      setBlocks(prev => [...prev, { id: newBlockId, name: adhocText, color: ADHOC_COLOR, duration }])
      const setTarget = track === 'ideal' ? setIdeal : setActual
      setTarget(prev => [...prev, { id: uid(), blockId: newBlockId, startSlot, duration }])
      setPicking(null)
      return
    }
    if (isOccupied(startSlot, duration, track, movingPlacedId)) return
    if (movingPlacedId) {
      const setter = movingTrack === 'ideal' ? setIdeal : setActual
      setter(prev => prev.filter(p => p.id !== movingPlacedId))
    }
    const setTarget = track === 'ideal' ? setIdeal : setActual
    setTarget(prev => [...prev, { id: uid(), blockId, startSlot, duration }])
    setPicking(null)
  }, [picking, isOccupied])

  const handleClickPlaced = useCallback((placed, track) => {
    setPicking({ blockId: placed.blockId, duration: placed.duration, movingPlacedId: placed.id, movingTrack: track })
  }, [])

  const handleDrop = useCallback((slot, track) => {
    if (!dragInfo) return

    // ── Multi-block drop ──────────────────────────────────────────────────
    if (dragInfo.isMulti) {
      const anchorStart = Math.max(0, slot - dragInfo.offsetSlot)
      const sourceArr = dragInfo.fromTrack === 'ideal' ? ideal : actual
      const moves = dragInfo.multiIds.map(id => {
        const orig = sourceArr.find(p => p.id === id)
        if (!orig) return null
        return { ...orig, startSlot: anchorStart + dragInfo.multiOffsets[id] }
      }).filter(Boolean)

      if (moves.some(m => m.startSlot < 0 || m.startSlot + m.duration > 48)) return

      const selectedSet = new Set(dragInfo.multiIds)
      const targetArr = track === 'ideal' ? ideal : actual
      const fixed = targetArr.filter(p => !selectedSet.has(p.id))

      for (const move of moves) {
        if (fixed.some(f => move.startSlot < f.startSlot + f.duration && move.startSlot + move.duration > f.startSlot)) return
        if (moves.some(m => m.id !== move.id && move.startSlot < m.startSlot + m.duration && move.startSlot + move.duration > m.startSlot)) return
      }

      setIdeal(prev => prev.filter(p => !selectedSet.has(p.id)))
      setActual(prev => prev.filter(p => !selectedSet.has(p.id)))
      const setTarget = track === 'ideal' ? setIdeal : setActual
      setTarget(prev => [...prev, ...moves])
      setSelection(new Set())
      setSelectionTrack(null)
      setDragInfo(null)
      return
    }

    // ── Single-block drop ─────────────────────────────────────────────────

    // Adhoc drops (MVP / starred goal cards) carry their own text — handle before getBlock
    if (dragInfo.source === 'adhoc') {
      const duration  = dragInfo.placedDuration ?? ADHOC_DURATION
      const startSlot = Math.max(0, slot)
      if (startSlot + duration > 48) return
      if (isOccupied(startSlot, duration, track, null)) return
      const newBlockId = uid()
      setBlocks(prev => [...prev, { id: newBlockId, name: dragInfo.taskText, color: ADHOC_COLOR, duration }])
      const setTarget = track === 'ideal' ? setIdeal : setActual
      setTarget(prev => [...prev, { id: uid(), blockId: newBlockId, startSlot, duration }])
      setDragInfo(null)
      return
    }

    const block = getBlock(dragInfo.blockId)
    if (!block) return

    const duration = dragInfo.placedDuration ?? block.duration
    const startSlot = Math.max(0, slot - (dragInfo.offsetSlot ?? 0))
    if (startSlot + duration > 48) return

    const excludeId = dragInfo.fromTrack === track ? (dragInfo.placedId ?? null) : null
    if (isOccupied(startSlot, duration, track, excludeId)) return

    const setTarget = track === 'ideal' ? setIdeal : setActual

    if (dragInfo.source === 'palette') {
      setTarget(prev => [...prev, {
        id: uid(),
        blockId: dragInfo.blockId,
        startSlot,
        duration,
      }])
    } else if (dragInfo.source === 'placed') {
      if (dragInfo.isDuplicate) {
        setTarget(prev => [...prev, {
          id: uid(),
          blockId: dragInfo.blockId,
          startSlot,
          duration,
        }])
      } else if (dragInfo.fromTrack === track) {
        setTarget(prev => prev.map(p =>
          p.id === dragInfo.placedId ? { ...p, startSlot } : p
        ))
      } else {
        const setSource = dragInfo.fromTrack === 'ideal' ? setIdeal : setActual
        setSource(prev => prev.filter(p => p.id !== dragInfo.placedId))
        setTarget(prev => [...prev, {
          id: uid(),
          blockId: dragInfo.blockId,
          startSlot,
          duration,
        }])
      }
    }
    setDragInfo(null)
  }, [dragInfo, getBlock, isOccupied, ideal, actual])

  const handleResize = useCallback((placedId, newDuration, track, newStartSlot) => {
    const setter = track === 'ideal' ? setIdeal : setActual
    setter(prev => prev.map(p => p.id === placedId ? {
      ...p,
      duration: newDuration,
      ...(newStartSlot !== undefined ? { startSlot: newStartSlot } : {}),
    } : p))
  }, [])

  const handleRemovePlaced = useCallback((placedId, track) => {
    const setter = track === 'ideal' ? setIdeal : setActual
    setter(prev => prev.filter(p => p.id !== placedId))
  }, [])

  const handleAddBlock = useCallback((block) => {
    setBlocks(prev => [...prev, { ...block, id: uid() }])
  }, [])

  const handleRemoveBlock = useCallback((blockId) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, deleted: true } : b))
  }, [])

  const handleClearDay = useCallback((track) => {
    if (track === 'ideal') setIdeal([])
    else if (track === 'actual') setActual([])
    else { setIdeal([]); setActual([]) }
  }, [])

  const handleEditBlock = useCallback((blockId, updates) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...updates } : b))
  }, [])

  const handleEditPlacedInstance = useCallback((blockId, updates, placedId, track) => {
    const newBlockId = uid()
    setBlocks(prev => {
      const orig = prev.find(b => b.id === blockId)
      return [...prev, { ...orig, ...updates, id: newBlockId, paletteHidden: true }]
    })
    const setter = track === 'ideal' ? setIdeal : setActual
    setter(prev => prev.map(p => p.id === placedId
      ? { ...p, blockId: newBlockId, ...(updates.duration != null ? { duration: updates.duration } : {}) }
      : p
    ))
  }, [])

  const handleReorderBlocks = useCallback((fromId, toId) => {
    setBlocks(prev => {
      const arr = [...prev]
      const fromIdx = arr.findIndex(b => b.id === fromId)
      const toIdx   = arr.findIndex(b => b.id === toId)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev
      const [item] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, item)
      return arr
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragInfo(null)
  }, [])

  const handleDistractionAdd       = useCallback((text) => {
    setDistractions(prev => [...prev, { id: uid(), text, done: false }])
  }, [])
  const handleDistractionToggle    = useCallback((id) => {
    setDistractions(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [])
  const handleDistractionDelete    = useCallback((id) => {
    setDistractions(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleMvpTextChange = useCallback((idx, text) => {
    setMvp(prev => ({ ...prev, goals: prev.goals.map((g, i) => i === idx ? { ...g, text } : g) }))
  }, [])
  const handleMvpToggle = useCallback((idx) => {
    setMvp(prev => ({ ...prev, goals: prev.goals.map((g, i) => i === idx ? { ...g, done: !g.done } : g) }))
  }, [])
  const handleDistractionClearDone = useCallback(() => {
    setDistractions(prev => prev.filter(t => !t.done))
  }, [])
  const handleDistractionReorder   = useCallback((reordered) => {
    setDistractions(reordered)
  }, [])
  const handleDistractionEdit      = useCallback((id, text) => {
    setDistractions(prev => prev.map(t => t.id === id ? { ...t, text } : t))
  }, [])

  const handleSaveTemplate = useCallback((name, savedTrack) => {
    const placed = savedTrack === 'ideal' ? ideal : actual
    const blockIds = new Set(placed.map(p => p.blockId))
    const blockDefs = {}
    for (const id of blockIds) {
      const b = blocks.find(b => b.id === id)
      if (b) blockDefs[id] = b
    }
    setTemplates(prev => [...prev, {
      id: uid(),
      name,
      savedTrack,
      placedItems: placed.map(p => ({ blockId: p.blockId, startSlot: p.startSlot, duration: p.duration })),
      blockDefs,
      savedAt: Date.now(),
    }])
  }, [ideal, actual, blocks])

  const handleApplyTemplate = useCallback((template, targetTrack, replace) => {
    const existingIds = new Set(blocks.map(b => b.id))
    const toRestore = Object.values(template.blockDefs)
      .filter(b => !existingIds.has(b.id))
      .map(b => ({ ...b, paletteHidden: true }))
    if (toRestore.length > 0) setBlocks(prev => [...prev, ...toRestore])
    const setter = targetTrack === 'ideal' ? setIdeal : setActual
    const newItems = template.placedItems.map(p => ({ ...p, id: uid() }))
    setter(prev => replace ? newItems : [...prev, ...newItems])
  }, [blocks])

  const handleDeleteTemplate = useCallback((id) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleRenameTemplate = useCallback((id, name) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, name } : t))
  }, [])

  const handleTreeCreate = useCallback(() => {
    setTrees(prev => [...prev, makeTree()])
    setActiveView('tree')
  }, [])

  const handleTreeDelete = useCallback((treeId) => {
    const tree = trees.find(t => t.id === treeId)
    if (tree && !window.confirm(`Delete "${tree.root.text.trim() || 'Untitled Goal'}" and all its subgoals?`)) return
    setTrees(prev => prev.filter(t => t.id !== treeId))
  }, [trees])

  const handleTreeNodeTextChange = useCallback((treeId, nodeId, text) => {
    setTrees(prev => prev.map(t => t.id === treeId ? { ...t, root: updateNodeText(t.root, nodeId, text) } : t))
  }, [])

  const handleTreeNodeAddChild = useCallback((treeId, parentId, newId) => {
    setTrees(prev => prev.map(t => t.id === treeId ? { ...t, root: addChildNode(t.root, parentId, newId) } : t))
  }, [])

  const handleTreeNodeInsertAbove = useCallback((treeId, targetId, newId) => {
    setTrees(prev => prev.map(t => t.id === treeId ? { ...t, root: insertNodeAbove(t.root, targetId, newId) } : t))
  }, [])

  const handleTreeNodeDelete = useCallback((treeId, nodeId) => {
    setTrees(prev => prev.map(t => t.id === treeId ? { ...t, root: removeNode(t.root, nodeId) } : t))
  }, [])

  const handleTreeNodeToggleDone = useCallback((treeId, nodeId, done) => {
    setTrees(prev => prev.map(t => t.id === treeId ? { ...t, root: setNodeDone(t.root, nodeId, done, done ? todayStr() : null) } : t))
  }, [])

  const handleTreeNodeDateChange = useCallback((treeId, nodeId, date) => {
    setTrees(prev => prev.map(t => t.id === treeId ? { ...t, root: setNodeDone(t.root, nodeId, true, date) } : t))
  }, [])

  const handleTreeNodeToggleStar = useCallback((treeId, nodeId) => {
    setTrees(prev => prev.map(t => t.id === treeId ? { ...t, root: toggleNodeStar(t.root, nodeId) } : t))
  }, [])

  const handleTreeArchiveToggle = useCallback((treeId) => {
    setTrees(prev => prev.map(t => t.id === treeId ? { ...t, archived: !t.archived } : t))
  }, [])

  const starredGoals = useMemo(() => {
    return trees
      .filter(t => !t.archived)
      .flatMap(t => collectStarred(t.root, t.root.text.trim() || 'Untitled Goal'))
  }, [trees])

  const handleResetData = useCallback(() => {
    setBlocks(DEFAULT_BLOCKS)
    setIdeal([])
    setActual([])
    setSettings(DEFAULT_SETTINGS)
    setTemplates([])
    setTrees([])
    localStorage.removeItem('tb-help-hint-dismissed')
    localStorage.removeItem('tb-mobile-hint-dismissed')
    localStorage.removeItem('tb-picking-tip-dismissed')
    setShowHelpHint(true)
    setShowMobileHint(window.matchMedia('(max-width: 640px)').matches)
    setShowPickingTip(true)
  }, [])

  const handleExportData = useCallback(() => {
    const data = JSON.stringify({
      version: 1,
      blocks,
      ideal,
      actual,
      settings,
      templates,
      trees,
    }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `timeblocks-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [blocks, ideal, actual, settings, templates, trees])

  const handleImportData = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result)
        if (d.blocks)       setBlocks(d.blocks)
        if (d.ideal)        setIdeal(d.ideal)
        if (d.actual)       setActual(d.actual)
        if (d.settings)     setSettings(d.settings)
        if (d.templates)    setTemplates(d.templates)
        if (d.trees)        setTrees(d.trees)
      } catch { /* ignore bad files */ }
    }
    reader.readAsText(file)
  }, [])

  // Don't block render on auth — app works with localStorage while auth resolves

  useEffect(() => {
    function accentRgba(alpha) {
      const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
      if (hex.startsWith('#') && hex.length === 7) {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      return `rgba(0, 229, 255, ${alpha})`
    }
    if (settings.pomodoroPageFill) {
      if (pomoState.phase === 'running') {
        document.body.style.setProperty('--pomo-fill-tint', accentRgba(0.2))
        document.body.style.setProperty('--pomo-fill-pct', `${pomoState.progress * 100}%`)
        document.body.classList.remove('pomo-ringing')
      } else if (pomoState.phase === 'ringing') {
        document.body.style.setProperty('--pomo-fill-tint', accentRgba(0.2))
        document.body.style.setProperty('--pomo-fill-pct', '0%')
        document.body.classList.add('pomo-ringing')
      } else {
        document.body.style.removeProperty('--pomo-fill-tint')
        document.body.style.removeProperty('--pomo-fill-pct')
        document.body.classList.remove('pomo-ringing')
      }
    } else {
      document.body.style.removeProperty('--pomo-fill-tint')
      document.body.style.removeProperty('--pomo-fill-pct')
      document.body.classList.remove('pomo-ringing')
    }
  }, [settings.pomodoroPageFill, settings.theme, pomoState])

  return (
    <div className={`app${activeView === 'tree' ? ' app--tree-view' : ''}`}>
      <div className="app-header-wrap">
      <header className="app-header">
        <div className="app-title-block">
          <h1 className="app-title">TIMEBLOCKS</h1>
          <p className="app-subtitle">{activeView === 'tree' ? 'plant a goal · grow the steps' : 'drag · drop · build your day'}</p>
        </div>
        <div className="app-header-actions">
          <div className="help-hint-wrap">
            <button
              className={`tmpl-btn help-btn${showHelpHint ? ' help-btn--glow' : ''}`}
              onClick={() => { setShowHelp(true); dismissHelpHint() }}
              title="Help / Keyboard Shortcuts"
            >
              ?
            </button>
            {showHelpHint && (
              <div className="help-hint-bubble">
                New here? Start with the guide
              </div>
            )}
          </div>
          <button className="tmpl-btn" onClick={() => setShowTemplates(true)} title="Templates">            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="2.5" width="14" height="15" rx="1.5" />
              <line x1="6.5" y1="7"  x2="13.5" y2="7"  />
              <line x1="6.5" y1="10" x2="13.5" y2="10" />
              <line x1="6.5" y1="13" x2="10.5" y2="13" />
            </svg>
          </button>
          <button className="distractions-nav-btn" onClick={() => setShowDistractions(true)} title="Brain Dump">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ display: 'block' }}>
              <path d="M10 2a7 7 0 1 0 4.95 11.95l2.83 2.83a1 1 0 0 0 1.41-1.41l-2.83-2.83A7 7 0 0 0 10 2zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 10 4z"/>
              <circle cx="7.5" cy="9" r="1"/>
              <circle cx="10" cy="9" r="1"/>
              <circle cx="12.5" cy="9" r="1"/>
            </svg>
          </button>
          <button className="settings-btn" onClick={() => setShowSettings(true)} title="Settings">
            ⚙
          </button>
          <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button className="auth-avatar-btn" onClick={() => setShowUserMenu(m => !m)} title={user ? `Signed in as ${user.email}` : 'Account'}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="auth-avatar-img" referrerPolicy="no-referrer" />
              : user
                ? <span className="auth-avatar-initial">{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
                : <svg viewBox="0 0 20 20" fill="currentColor" width="10" height="10" aria-hidden="true"><path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0H3z"/></svg>
            }
          </button>
          {showUserMenu && (
            <div className="user-menu">
              {user ? (
                <>
                  <div className="user-menu-greeting">Hi, {user.displayName?.split(' ')[0] || user.email}!</div>
                  <button className="user-menu-btn" onClick={() => { handleSignOut(); setShowUserMenu(false) }}>Sign out</button>
                </>
              ) : (
                <>
                  <div className="user-menu-greeting">Not signed in</div>
                  <button className="user-menu-btn user-menu-btn--signin" onClick={() => { handleSignIn(); setShowUserMenu(false) }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </button>
                  <button className="user-menu-btn user-menu-btn--signin" onClick={() => { setShowAuthModal(true); setShowUserMenu(false) }}>
                    ✉ Sign in with Email
                  </button>
                </>
              )}
            </div>
          )}
          </div>
        </div>
        <div className="hamburger-hint-wrap">
          <button className="mobile-profile-btn" onClick={() => setShowAuthModal(true)} title={user ? (user.displayName || user.email) : 'Account'}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="auth-avatar-img" referrerPolicy="no-referrer" />
              : user
                ? <span className="auth-avatar-initial">{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
                : <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0H3z"/></svg>
            }
          </button>
          <button className={`hamburger-btn${showHelpHint && !showMobileMenu ? ' help-btn--glow' : ''}`} onClick={() => setShowMobileMenu(m => !m)} aria-label="Menu">
            {showMobileMenu ? '✕' : '☰'}
          </button>
          {showHelpHint && !showMobileMenu && (
            <div className="help-hint-bubble help-hint-bubble--left">
              New here? Tap for a guide
            </div>
          )}
        </div>
      </header>

      {showMobileMenu && (
        <>
          <div className="mobile-menu-backdrop" onClick={() => setShowMobileMenu(false)} />
          <div className="mobile-menu">
          <button className={`mobile-menu-item${showHelpHint ? ' mobile-menu-item--glow' : ''}`} onClick={() => { setShowHelp(true); setShowMobileMenu(false); dismissHelpHint() }}>
            <span className="mobile-menu-icon">?</span> Help
          </button>
          <button className="mobile-menu-item" onClick={() => { setShowTemplates(true); setShowMobileMenu(false) }}>
            <svg className="mobile-menu-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="2.5" width="14" height="15" rx="1.5" />
              <line x1="6.5" y1="7"  x2="13.5" y2="7"  />
              <line x1="6.5" y1="10" x2="13.5" y2="10" />
              <line x1="6.5" y1="13" x2="10.5" y2="13" />
            </svg>
            Templates
          </button>
          <button className="mobile-menu-item" onClick={() => { setShowSettings(true); setShowMobileMenu(false) }}>
            <svg className="mobile-menu-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
            Settings
          </button>
          <button className="mobile-menu-item" onClick={() => { setShowDistractions(true); setShowMobileMenu(false) }}>
            <svg className="mobile-menu-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 2a7 7 0 1 0 4.95 11.95l2.83 2.83a1 1 0 0 0 1.41-1.41l-2.83-2.83A7 7 0 0 0 10 2zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 10 4z"/>
              <circle cx="7.5" cy="9" r="1"/>
              <circle cx="10" cy="9" r="1"/>
              <circle cx="12.5" cy="9" r="1"/>
            </svg>
            Brain Dump
          </button>
        </div>
        </>
      )}
      </div>{/* end app-header-wrap */}

      <div className="main-tabs">
        <button
          className={`main-tab${activeView === 'schedule' ? ' main-tab--active' : ''}`}
          onClick={() => setActiveView('schedule')}
        >SCHEDULE</button>
        <button
          className={`main-tab${activeView === 'tree' ? ' main-tab--active' : ''}`}
          onClick={() => setActiveView('tree')}
        >THE TREE</button>
      </div>

      {activeView === 'schedule' && showMobileHint && settings.noDragMode && (
        <div className="mobile-hint-banner">
          <span><strong>Click-to-place mode:</strong> tap a block below, then tap a slot to place it. Change in Settings → Interaction.</span>
          <button className="mobile-hint-settings" onClick={() => { setShowSettings(true); dismissMobileHint() }}>Settings</button>
          <button className="mobile-hint-dismiss" onClick={dismissMobileHint}>✕</button>
        </div>
      )}

      {activeView === 'schedule' && picking && showPickingTip && (
        <div className="picking-banner">
          <span>Tap a slot to place <strong>{picking.adhocText ?? getBlock(picking.blockId)?.name}</strong> · {picking.adhocText ? 'Tap the item again to cancel' : 'Tap it again to edit'} · tap anywhere else to cancel</span>
          <button className="picking-cancel" onClick={dismissPickingTip}>Got it</button>
        </div>
      )}

      {activeView === 'tree' ? (
        <GoalTreeView
          trees={trees}
          onCreateTree={handleTreeCreate}
          onDeleteTree={handleTreeDelete}
          onNodeTextChange={handleTreeNodeTextChange}
          onNodeAddChild={handleTreeNodeAddChild}
          onNodeInsertAbove={handleTreeNodeInsertAbove}
          onNodeDelete={handleTreeNodeDelete}
          onNodeToggleDone={handleTreeNodeToggleDone}
          onNodeDateChange={handleTreeNodeDateChange}
          onNodeToggleStar={handleTreeNodeToggleStar}
          onToggleArchive={handleTreeArchiveToggle}
        />
      ) : (
      <div className="app-body">
        <div className={`left-sidebar${settings.showMinimap === false && settings.showPomodoro === false ? ' left-sidebar--hidden' : ''}`}>
          {settings.showMinimap !== false && (
            <Minimap
              ideal={ideal}
              actual={actual}
              blocks={blocks}
              getBlock={getBlock}
              scrollRef={gridScrollRef}
            />
          )}
          {settings.showPomodoro !== false && <PomodoroTimer minutes={settings.pomodoroMinutes ?? 25} onProgress={(phase, progress) => setPomoState({ phase, progress })} />}
          {settings.showColorChart !== false && (
            <ColorBreakdown ideal={ideal} actual={actual} getBlock={getBlock} />
          )}
        </div>
        <TimeGrid
          blocks={blocks}
          ideal={ideal}
          actual={actual}
          dragInfo={dragInfo}
          settings={settings}
          scrollRef={gridScrollRef}
          selection={selection}
          selectionTrack={selectionTrack}
          onSelectionChange={(sel, track) => { setSelection(sel); setSelectionTrack(track) }}
          onDragStart={setDragInfo}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onResize={handleResize}
          onResizeStart={handleResizeBegin}
          onResizeEnd={handleResizeCommit}
          onRemovePlaced={handleRemovePlaced}
          onEditPlaced={(placed, track) => setEditingPlaced({ placed, track })}
          getBlock={getBlock}
          isOccupied={isOccupied}
          noDragMode={settings.noDragMode}
          picking={picking}
          onClickSlot={handleClickSlot}
          onClickPlaced={handleClickPlaced}
        />
        <BlockPalette
          blocks={blocks}
          settings={settings}
          onDragStart={setDragInfo}
          onDragEnd={handleDragEnd}
          onAddBlock={handleAddBlock}
          onEditBlock={handleEditBlock}
          onRemoveBlock={handleRemoveBlock}
          onReorderBlocks={handleReorderBlocks}
          noDragMode={settings.noDragMode}
          picking={picking}
          onPick={handlePick}
          onAddDistraction={handleDistractionAdd}
          onOpenDistractions={() => setShowDistractions(true)}
          mvp={mvp}
          onMvpTextChange={handleMvpTextChange}
          onMvpToggle={handleMvpToggle}
          starredGoals={starredGoals}
          onAdhocDragStart={handleAdhocDragStart}
          onAdhocPick={handleAdhocPick}
        />
      </div>
      )}

      {activeView === 'schedule' && (
        <MobileBlockBar
          blocks={blocks}
          onAddBlock={handleAddBlock}
          noDragMode={settings.noDragMode}
          picking={picking}
          onPick={handlePick}
          onEditBlock={handleEditBlock}
          onRemoveBlock={handleRemoveBlock}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={(s) => setSettings(s)}
          onClearDay={handleClearDay}
          onExport={handleExportData}
          onImport={handleImportData}
          onReset={handleResetData}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showDistractions && (
        <DistractionsModal
          tasks={distractions}
          onAdd={handleDistractionAdd}
          onToggle={handleDistractionToggle}
          onDelete={handleDistractionDelete}
          onClearDone={handleDistractionClearDone}
          onReorder={handleDistractionReorder}
          onEdit={handleDistractionEdit}
          onClose={() => setShowDistractions(false)}
        />
      )}

      {showTemplates && (
        <TemplatesModal
          templates={templates}
          ideal={ideal}
          actual={actual}
          onSave={handleSaveTemplate}
          onApply={(tmpl, track, replace) => { handleApplyTemplate(tmpl, track, replace); setShowTemplates(false) }}
          onDelete={handleDeleteTemplate}
          onRename={handleRenameTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {editingPlaced && (() => {
        const placedArr = editingPlaced.track === 'ideal' ? ideal : actual
        const { startSlot, duration: placedDuration, id: placedId } = editingPlaced.placed
        const nextBlock = placedArr
          .filter(p => p.id !== placedId && p.startSlot > startSlot)
          .sort((a, b) => a.startSlot - b.startSlot)[0]
        const maxDuration = nextBlock ? nextBlock.startSlot - startSlot : 48 - startSlot
        return (
          <PlacedBlockEditModal
            block={getBlock(editingPlaced.placed.blockId)}
            placedId={placedId}
            track={editingPlaced.track}
            placedDuration={placedDuration}
            maxDuration={maxDuration}
            onSave={(blockId, updates) => handleEditPlacedInstance(blockId, updates, placedId, editingPlaced.track)}
            onRemove={handleRemovePlaced}
            onClose={() => setEditingPlaced(null)}
          />
        )
      })()}

    </div>
  )
}
