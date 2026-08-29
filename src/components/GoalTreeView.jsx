import { useEffect, useMemo, useRef, useState } from 'react'
import { uid, collectCompleted } from '../utils/tree.js'

function AutoTextarea({ value, onChange, placeholder, className, autoFocus, onFocused }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={autoFocus ? onFocused : undefined}
      autoFocus={autoFocus}
      rows={1}
      maxLength={200}
    />
  )
}

function formatCompletedDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function TreeNodeItem({ node, isRoot, focusNodeId, onTextChange, onAddChild, onInsertAbove, onDelete, onToggleDone, onDateChange, onToggleStar, onFocused }) {
  const [editingDate, setEditingDate] = useState(false)

  function handleDelete() {
    if (node.children.length > 0 && !window.confirm('Delete this subgoal and everything under it?')) return
    onDelete(node.id)
  }

  return (
    <li>
      <div className={`tree-node${isRoot ? ' tree-node--root' : ''}${node.done ? ' tree-node--done' : ''}`}>
        {!isRoot && (
          <button className="tree-node-insert" onClick={() => onInsertAbove(node.id)} title="Insert a step above this one">+</button>
        )}
        <div className="tree-node-row">
          <input
            type="checkbox"
            className="tree-node-check"
            checked={!!node.done}
            onChange={(e) => onToggleDone(node.id, e.target.checked)}
            title={node.done ? 'Mark incomplete' : 'Mark complete'}
          />
          <AutoTextarea
            className="tree-node-input"
            value={node.text}
            placeholder={isRoot ? 'What do you want to achieve?' : 'A smaller step...'}
            onChange={(text) => onTextChange(node.id, text)}
            autoFocus={node.id === focusNodeId}
            onFocused={onFocused}
          />
          {!isRoot && (
            <button
              className={`tree-node-star${node.starred ? ' tree-node-star--active' : ''}`}
              onClick={() => onToggleStar(node.id)}
              title={node.starred ? 'Unstar (remove from Goals tab)' : 'Star (show in Goals tab to schedule)'}
            >★</button>
          )}
        </div>
        <div className="tree-node-actions">
          <span className="tree-node-date-slot">
            {node.done && (
              editingDate ? (
                <input
                  type="date"
                  className="tree-node-date-input"
                  value={node.completedAt || ''}
                  onChange={(e) => onDateChange(node.id, e.target.value)}
                  onBlur={() => setEditingDate(false)}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className="tree-node-date-label"
                  onClick={() => setEditingDate(true)}
                  title="Change completion date"
                >{formatCompletedDate(node.completedAt)}</button>
              )
            )}
          </span>
          <div className="tree-node-actions-right">
            <button className="tree-node-add" onClick={() => onAddChild(node.id)} title="Add subgoal">+</button>
            {!isRoot && (
              <button className="tree-node-delete" onClick={handleDelete} title="Delete">×</button>
            )}
          </div>
        </div>
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map(child => (
            <TreeNodeItem
              key={child.id}
              node={child}
              focusNodeId={focusNodeId}
              onTextChange={onTextChange}
              onAddChild={onAddChild}
              onInsertAbove={onInsertAbove}
              onDelete={onDelete}
              onToggleDone={onToggleDone}
              onDateChange={onDateChange}
              onToggleStar={onToggleStar}
              onFocused={onFocused}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function TreeSection({ tree, collapsed, onToggleCollapse, onDeleteTree, onToggleArchive, focusNodeId, onTextChange, onAddChild, onInsertAbove, onDelete, onToggleDone, onDateChange, onToggleStar, onFocused }) {
  return (
    <section className="tree-section">
      <header className="tree-section-header">
        <button className="tree-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? '▸' : '▾'}
        </button>
        <span className="tree-section-title">{tree.root.text.trim() || 'Untitled Goal'}</span>
        <button className="tree-section-archive" onClick={onToggleArchive} title={tree.archived ? 'Unarchive' : 'Archive'}>▤</button>
        <button className="tree-section-delete" onClick={onDeleteTree} title="Delete goal">×</button>
      </header>
      {!collapsed && (
        <div className="tree-canvas">
          <ul className="tree-diagram">
            <TreeNodeItem
              node={tree.root}
              isRoot
              focusNodeId={focusNodeId}
              onTextChange={onTextChange}
              onAddChild={onAddChild}
              onInsertAbove={onInsertAbove}
              onDelete={onDelete}
              onToggleDone={onToggleDone}
              onDateChange={onDateChange}
              onToggleStar={onToggleStar}
              onFocused={onFocused}
            />
          </ul>
        </div>
      )}
    </section>
  )
}

function RecentlyCompleted({ trees }) {
  const groups = useMemo(() => {
    const items = trees
      .filter(t => !t.archived)
      .flatMap(t => collectCompleted(t.root, t.root.text.trim() || 'Untitled Goal'))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))

    const byDate = new Map()
    for (const item of items) {
      if (!byDate.has(item.completedAt)) byDate.set(item.completedAt, [])
      byDate.get(item.completedAt).push(item)
    }
    return [...byDate.entries()].slice(0, 6).map(([date, items]) => ({ date, items }))
  }, [trees])

  if (groups.length === 0) return null

  return (
    <div className="tree-recent">
      <span className="tree-recent-title">RECENTLY COMPLETED</span>
      <div className="tree-recent-list">
        {groups.map(({ date, items }) => (
          <span key={date} className="tree-recent-group">
            <span className="tree-recent-date">{formatCompletedDate(date)}</span>
            {' — '}
            {items.map((item, i) => (
              <span key={item.id} className="tree-recent-item">
                {item.text.trim() || 'Untitled'}
                <span className="tree-recent-tree"> ({item.treeName})</span>
                {i < items.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function GoalTreeView({ trees, onCreateTree, onDeleteTree, onNodeTextChange, onNodeAddChild, onNodeInsertAbove, onNodeDelete, onNodeToggleDone, onNodeDateChange, onNodeToggleStar, onToggleArchive }) {
  const [focusNodeId, setFocusNodeId] = useState(null)
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [showArchived, setShowArchived] = useState(false)

  const activeTrees = trees.filter(t => !t.archived)
  const archivedTrees = trees.filter(t => t.archived)

  function toggleCollapse(treeId) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(treeId)) next.delete(treeId)
      else next.add(treeId)
      return next
    })
  }

  function handleAddChild(treeId, parentId) {
    const newId = uid()
    onNodeAddChild(treeId, parentId, newId)
    setFocusNodeId(newId)
  }

  function handleInsertAbove(treeId, targetId) {
    const newId = uid()
    onNodeInsertAbove(treeId, targetId, newId)
    setFocusNodeId(newId)
  }

  function renderSection(t) {
    return (
      <TreeSection
        key={t.id}
        tree={t}
        collapsed={collapsed.has(t.id)}
        onToggleCollapse={() => toggleCollapse(t.id)}
        onDeleteTree={() => onDeleteTree(t.id)}
        onToggleArchive={() => onToggleArchive(t.id)}
        focusNodeId={focusNodeId}
        onTextChange={(nodeId, text) => onNodeTextChange(t.id, nodeId, text)}
        onAddChild={(parentId) => handleAddChild(t.id, parentId)}
        onInsertAbove={(targetId) => handleInsertAbove(t.id, targetId)}
        onDelete={(nodeId) => onNodeDelete(t.id, nodeId)}
        onToggleDone={(nodeId, done) => onNodeToggleDone(t.id, nodeId, done)}
        onDateChange={(nodeId, date) => onNodeDateChange(t.id, nodeId, date)}
        onToggleStar={(nodeId) => onNodeToggleStar(t.id, nodeId)}
        onFocused={() => setFocusNodeId(null)}
      />
    )
  }

  return (
    <div className="tree-view">
      <div className="tree-view-header">
        <span className="tree-view-title">YOUR GOALS</span>
        <button className="tree-new-btn" onClick={onCreateTree} title="New goal tree">+ New Goal</button>
      </div>

      <RecentlyCompleted trees={trees} />

      {trees.length === 0 ? (
        <div className="tree-empty-state">
          <p>Set a goal, then break it into the smaller steps that get you there.</p>
          <button className="tree-new-btn tree-new-btn--big" onClick={onCreateTree}>+ New Goal</button>
        </div>
      ) : (
        <>
          {activeTrees.length > 0 && (
            <div className="tree-sections">
              {activeTrees.map(renderSection)}
            </div>
          )}

          {archivedTrees.length > 0 && (
            <div className="tree-archived-wrap">
              <button className="tree-archived-toggle" onClick={() => setShowArchived(s => !s)}>
                {showArchived ? '▾' : '▸'} ARCHIVED ({archivedTrees.length})
              </button>
              {showArchived && (
                <div className="tree-sections tree-sections--archived">
                  {archivedTrees.map(renderSection)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
