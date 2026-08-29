export const uid = () => Math.random().toString(36).slice(2)

export function makeNode(id, text = '') {
  return { id, text, children: [], done: false, completedAt: null, starred: false }
}

export function makeTree() {
  return { id: uid(), root: makeNode(uid(), ''), createdAt: Date.now(), archived: false }
}

export function updateNodeText(node, id, text) {
  if (node.id === id) return { ...node, text }
  if (node.children.length === 0) return node
  return { ...node, children: node.children.map(c => updateNodeText(c, id, text)) }
}

export function setNodeDone(node, id, done, completedAt) {
  if (node.id === id) return { ...node, done, completedAt: done ? completedAt : null }
  if (node.children.length === 0) return node
  return { ...node, children: node.children.map(c => setNodeDone(c, id, done, completedAt)) }
}

export function toggleNodeStar(node, id) {
  if (node.id === id) return { ...node, starred: !node.starred }
  if (node.children.length === 0) return node
  return { ...node, children: node.children.map(c => toggleNodeStar(c, id)) }
}

export function addChildNode(node, parentId, newId) {
  if (node.id === parentId) return { ...node, children: [...node.children, makeNode(newId, '')] }
  if (node.children.length === 0) return node
  return { ...node, children: node.children.map(c => addChildNode(c, parentId, newId)) }
}

// Splices a new node between `targetId` and its parent: parent -> newNode -> target.
// No-op if targetId is the root (a root has no parent to insert above).
export function insertNodeAbove(node, targetId, newId) {
  const idx = node.children.findIndex(c => c.id === targetId)
  if (idx !== -1) {
    const target = node.children[idx]
    const inserted = { ...makeNode(newId, ''), children: [target] }
    const nextChildren = [...node.children]
    nextChildren[idx] = inserted
    return { ...node, children: nextChildren }
  }
  if (node.children.length === 0) return node
  return { ...node, children: node.children.map(c => insertNodeAbove(c, targetId, newId)) }
}

export function removeNode(node, id) {
  return { ...node, children: node.children.filter(c => c.id !== id).map(c => removeNode(c, id)) }
}

// Deletes `targetId` but reattaches its children to its own parent in its place,
// so subgoals underneath it move up a level instead of being deleted with it.
export function removeNodeKeepChildren(node, targetId) {
  const idx = node.children.findIndex(c => c.id === targetId)
  if (idx !== -1) {
    const target = node.children[idx]
    const nextChildren = [
      ...node.children.slice(0, idx),
      ...target.children,
      ...node.children.slice(idx + 1),
    ]
    return { ...node, children: nextChildren }
  }
  if (node.children.length === 0) return node
  return { ...node, children: node.children.map(c => removeNodeKeepChildren(c, targetId)) }
}

export function collectStarred(root, treeName) {
  const result = []
  function walk(node) {
    if (node.starred && !node.done) result.push({ id: node.id, text: node.text, treeName })
    node.children.forEach(walk)
  }
  walk(root)
  return result
}

export function collectCompleted(root, treeName) {
  const result = []
  function walk(node) {
    if (node.done && node.completedAt) result.push({ id: node.id, text: node.text, treeName, completedAt: node.completedAt })
    node.children.forEach(walk)
  }
  walk(root)
  return result
}

// ── Firestore storage boundary ──────────────────────────────────────────
// Firestore rejects documents nested more than ~20 levels deep. A recursive
// { children: [ { children: [...] } ] } tree burns 2 levels of that budget
// per tree-depth level, so anything past ~8-9 levels gets rejected outright.
// We flatten to a flat { id, parentId, ... } list (constant depth, like a DB
// table) purely for the read/write boundary, and rebuild the nested shape
// the rest of the app expects on the way back in. localStorage/export still
// use the native nested shape directly — only Firestore needs this.

function flattenNode(node, parentId, out) {
  out.push({ id: node.id, parentId, text: node.text, done: node.done, completedAt: node.completedAt, starred: node.starred })
  node.children.forEach(c => flattenNode(c, node.id, out))
  return out
}

export function treeToStorage(tree) {
  return { id: tree.id, createdAt: tree.createdAt, archived: !!tree.archived, nodes: flattenNode(tree.root, null, []) }
}

export function treeFromStorage(stored) {
  if (!stored.nodes) return stored // legacy nested format (synced before this fix) — already the right shape
  const byId = new Map(stored.nodes.map(n => [n.id, { id: n.id, text: n.text, done: n.done, completedAt: n.completedAt, starred: n.starred, children: [] }]))
  let root = null
  for (const n of stored.nodes) {
    const node = byId.get(n.id)
    if (n.parentId === null) { root = node; continue }
    byId.get(n.parentId)?.children.push(node)
  }
  return { id: stored.id, createdAt: stored.createdAt, archived: !!stored.archived, root }
}
