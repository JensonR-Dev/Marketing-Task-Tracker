import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

// ---- shared team password (set TEAM_PASSWORD env var to enable) ----
const TEAM_PASSWORD = process.env.TEAM_PASSWORD || ''

app.post('/api/login', (req, res) => {
  if (!TEAM_PASSWORD) return res.json({ ok: true, required: false })
  if ((req.body.password || '') === TEAM_PASSWORD) return res.json({ ok: true })
  res.status(401).json({ error: 'Wrong password' })
})

app.use('/api', (req, res, next) => {
  if (!TEAM_PASSWORD || req.path === '/login') return next()
  if (req.get('x-team-key') === TEAM_PASSWORD) return next()
  res.status(401).json({ error: 'Team password required' })
})

const TASK_FIELDS = [
  'title', 'owners', 'assigned_by', 'status', 'reviewed',
  'assigned_date', 'start_date', 'end_date', 'golive_date', 'notes'
]

function taskRow(row) {
  return { ...row, owners: JSON.parse(row.owners), reviewed: !!row.reviewed }
}

const insertNotification = db.prepare(
  'INSERT INTO notifications (recipient, actor, task_id, type, message) VALUES (?, ?, ?, ?, ?)'
)

function notify(recipients, actor, taskId, type, message) {
  for (const recipient of new Set(recipients)) {
    if (!recipient || recipient === actor) continue
    insertNotification.run(recipient, actor || null, taskId, type, message)
  }
}

// ---- bootstrap: everything the UI needs in one call ----
app.get('/api/bootstrap', (req, res) => {
  const members = db.prepare('SELECT * FROM members ORDER BY name').all()
  const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order, id').all()
  const tasks = db.prepare(`
    SELECT t.*, (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
    FROM tasks t ORDER BY t.sort_order, t.id
  `).all().map(taskRow)
  for (const p of projects) p.tasks = tasks.filter(t => t.project_id === p.id)
  res.json({ members, projects })
})

// ---- projects ----
app.post('/api/projects', (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Project name is required' })
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM projects').get().m
  const { lastInsertRowid } = db.prepare('INSERT INTO projects (name, sort_order) VALUES (?, ?)').run(name, maxOrder + 1)
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(lastInsertRowid)
  project.tasks = []
  res.status(201).json(project)
})

app.patch('/api/projects/:id', (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Project name is required' })
  const info = db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name, req.params.id)
  if (!info.changes) return res.status(404).json({ error: 'Project not found' })
  res.json({ ok: true })
})

app.delete('/api/projects/:id', (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ---- tasks ----
app.post('/api/projects/:id/tasks', (req, res) => {
  const actor = req.get('x-user') || null
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const title = (req.body.title || '').trim() || 'New task'
  const owners = req.body.owners || []
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM tasks WHERE project_id = ?').get(project.id).m
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO tasks (project_id, title, owners, assigned_by, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    project.id, title,
    JSON.stringify(owners),
    req.body.assigned_by || actor,
    req.body.status || 'Not yet started',
    maxOrder + 1
  )
  notify(owners, actor, lastInsertRowid, 'assigned',
    `${actor || 'Someone'} assigned you "${title}" in ${project.name}`)
  const row = db.prepare('SELECT *, 0 AS comment_count FROM tasks WHERE id = ?').get(lastInsertRowid)
  res.status(201).json(taskRow(row))
})

app.patch('/api/tasks/:id', (req, res) => {
  const actor = req.get('x-user') || null
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Task not found' })

  const sets = []
  const values = {}
  for (const field of TASK_FIELDS) {
    if (!(field in req.body)) continue
    sets.push(`${field} = @${field}`)
    let v = req.body[field]
    if (field === 'owners') v = JSON.stringify(v || [])
    if (field === 'reviewed') v = v ? 1 : 0
    if (v === '') v = null
    values[field] = v
  }
  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' })
  db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = @id`).run({ ...values, id: req.params.id })

  // notify anyone newly added as an owner
  if ('owners' in req.body) {
    const oldOwners = JSON.parse(existing.owners)
    const added = (req.body.owners || []).filter(o => !oldOwners.includes(o))
    if (added.length) {
      const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(existing.project_id)
      notify(added, actor, existing.id, 'assigned',
        `${actor || 'Someone'} assigned you "${existing.title}" in ${project.name}`)
    }
  }

  const row = db.prepare(`
    SELECT t.*, (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
    FROM tasks t WHERE t.id = ?
  `).get(req.params.id)
  res.json(taskRow(row))
})

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ---- comments ----
app.get('/api/tasks/:id/comments', (req, res) => {
  const rows = db.prepare('SELECT * FROM comments WHERE task_id = ? ORDER BY id').all(req.params.id)
  res.json(rows)
})

app.post('/api/tasks/:id/comments', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  const text = (req.body.text || '').trim()
  const author = (req.body.author || '').trim()
  if (!text || !author) return res.status(400).json({ error: 'Author and text are required' })
  const { lastInsertRowid } = db.prepare('INSERT INTO comments (task_id, author, text) VALUES (?, ?, ?)').run(task.id, author, text)
  notify(JSON.parse(task.owners), author, task.id, 'comment',
    `${author} commented on "${task.title}"`)
  res.status(201).json(db.prepare('SELECT * FROM comments WHERE id = ?').get(lastInsertRowid))
})

// ---- notifications ----
app.get('/api/notifications', (req, res) => {
  const user = req.get('x-user')
  if (!user) return res.json({ notifications: [], unread: 0 })
  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE recipient = ? ORDER BY id DESC LIMIT 50'
  ).all(user)
  const unread = db.prepare(
    'SELECT COUNT(*) AS n FROM notifications WHERE recipient = ? AND is_read = 0'
  ).get(user).n
  res.json({ notifications, unread })
})

app.post('/api/notifications/read', (req, res) => {
  const user = req.get('x-user')
  if (!user) return res.status(400).json({ error: 'Missing user' })
  if (req.body.all) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient = ?').run(user)
  } else if (Array.isArray(req.body.ids) && req.body.ids.length) {
    const markRead = db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient = ? AND id = ?')
    for (const id of req.body.ids) markRead.run(user, id)
  }
  res.json({ ok: true })
})

// ---- serve built frontend in production ----
const distDir = path.join(__dirname, '..', 'dist')
app.use(express.static(distDir))
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  res.sendFile(path.join(distDir, 'index.html'), err => { if (err) next() })
})

const PORT = process.env.API_PORT || (process.env.NODE_ENV === 'production' ? process.env.PORT : null) || 3001
app.listen(PORT, () => console.log(`Team tracker API running on http://localhost:${PORT}`))
