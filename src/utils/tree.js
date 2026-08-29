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
