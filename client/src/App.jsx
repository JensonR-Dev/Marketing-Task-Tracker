import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api.js'
import { STATUSES } from './constants.js'
import NamePicker from './components/NamePicker.jsx'
import ProjectGroup from './components/ProjectGroup.jsx'
import CommentsPanel from './components/CommentsPanel.jsx'
import Dashboard from './components/Dashboard.jsx'
import CalendarView from './components/CalendarView.jsx'
import Modal from './components/Modal.jsx'
import TaskFormModal from './components/TaskFormModal.jsx'
import NotificationsPanel from './components/NotificationsPanel.jsx'
import PasswordGate from './components/PasswordGate.jsx'

export default function App() {
  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('tracker-user') || '')
  const [view, setView] = useState('dashboard')
  // Projects view defaults to the signed-in member's own tasks
  const [filters, setFilters] = useState(() => ({ owner: localStorage.getItem('tracker-user') || '', status: '', search: '' }))
  const [commentsTask, setCommentsTask] = useState(null)
  const [modal, setModal] = useState(null)
  const [taskFormProjectId, setTaskFormProjectId] = useState(null)
  const [notifs, setNotifs] = useState({ notifications: [], unread: 0 })
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('tracker-theme') || 'dark')
  const userMenuRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('tracker-theme', theme)
  }, [theme])

  const loadData = useCallback(async () => {
    if (!(await api.hasSession())) { setLocked(true); return }
    return api.bootstrap()
      .then(data => { setMembers(data.members); setProjects(data.projects); setLocked(false) })
      .catch(e => { if (e.status === 401) setLocked(true); else setError(e.message) })
  }, [])

  useEffect(() => { loadData().finally(() => setLoading(false)) }, [loadData])

  // keep data fresh so teammates' changes appear without a manual refresh —
  // skipped while an input is focused to avoid clobbering in-progress edits
  useEffect(() => {
    const id = setInterval(() => {
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return
      loadData()
    }, 30000)
    return () => clearInterval(id)
  }, [loadData])

  // poll notifications
  const loadNotifs = useCallback(() => {
    if (!localStorage.getItem('tracker-user')) return
    api.getNotifications().then(setNotifs).catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUser) return
    loadNotifs()
    const id = setInterval(loadNotifs, 15000)
    return () => clearInterval(id)
  }, [currentUser, loadNotifs])

  useEffect(() => {
    if (!userMenuOpen) return
    function onClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [userMenuOpen])

  function pickUser(name) {
    localStorage.setItem('tracker-user', name)
    setCurrentUser(name)
    setNotifs({ notifications: [], unread: 0 })
    setUserMenuOpen(false)
    setFilters(f => ({ ...f, owner: name }))
  }

  // tasks assigned to me that I haven't seen yet -> highlighted rows
  const highlightTaskIds = useMemo(
    () => new Set(notifs.notifications.filter(n => !n.is_read && n.type === 'assigned').map(n => n.task_id)),
    [notifs]
  )

  async function markAllRead() {
    await api.markNotificationsRead({ all: true })
    loadNotifs()
  }

  async function markOneRead(id) {
    await api.markNotificationsRead({ ids: [id] })
    loadNotifs()
  }

  // ---- project actions ----
  function addProject() {
    setModal({
      type: 'input',
      title: 'New project',
      placeholder: 'Project name…',
      confirmLabel: 'Create project',
      onSubmit: async name => {
        try {
          const project = await api.createProject(name)
          setProjects(ps => [...ps, project])
          setView('projects')
        } catch (e) { setError(e.message) }
      }
    })
  }

  async function renameProject(id, name) {
    setProjects(ps => ps.map(p => (p.id === id ? { ...p, name } : p)))
    await api.renameProject(id, name).catch(e => setError(e.message))
  }

  function deleteProject(project) {
    setModal({
      type: 'confirm',
      title: 'Delete project',
      message: `Delete "${project.name}" and all ${project.tasks.length} of its tasks? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setProjects(ps => ps.filter(p => p.id !== project.id))
        await api.deleteProject(project.id).catch(e => setError(e.message))
      }
    })
  }

  // ---- task actions ----
  async function addTask(projectId) {
    try {
      // in "My tasks" view, a new task is assigned to the filtered member so it stays visible
      const task = await api.createTask(projectId, { title: 'New task', owners: filters.owner ? [filters.owner] : [] })
      setProjects(ps => ps.map(p => (p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p)))
    } catch (e) { setError(e.message) }
  }

  // used by the Dashboard's full task-detail form
  async function addTaskWithDetails(projectId, form) {
    const { title, owners, assigned_by, status, ...rest } = form
    const task = await api.createTask(projectId, { title, owners, assigned_by: assigned_by || null, status })
    const extra = {}
    for (const [k, v] of Object.entries(rest)) if (v !== '' && v !== false) extra[k] = v
    const finalTask = Object.keys(extra).length ? await api.updateTask(task.id, extra) : task
    setProjects(ps => ps.map(p => (p.id === projectId ? { ...p, tasks: [...p.tasks, finalTask] } : p)))
  }

  async function updateTask(taskId, patch) {
    setProjects(ps => ps.map(p => ({
      ...p,
      tasks: p.tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t))
    })))
    try {
      const saved = await api.updateTask(taskId, patch)
      setProjects(ps => ps.map(p => ({
        ...p,
        tasks: p.tasks.map(t => (t.id === taskId ? saved : t))
      })))
    } catch (e) {
      setError(e.message)
    }
  }

  function deleteTask(task) {
    setModal({
      type: 'confirm',
      title: 'Delete task',
      message: `Delete task "${task.title}"?`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setProjects(ps => ps.map(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== task.id) })))
        await api.deleteTask(task.id).catch(e => setError(e.message))
      }
    })
  }

  function onCommentAdded(taskId) {
    setProjects(ps => ps.map(p => ({
      ...p,
      tasks: p.tasks.map(t => (t.id === taskId ? { ...t, comment_count: t.comment_count + 1 } : t))
    })))
  }

  // ---- projects view filtering ----
  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const active = filters.owner || filters.status || search
    return projects.map(p => ({
      ...p,
      tasks: p.tasks.filter(t => {
        if (filters.owner && !t.owners.includes(filters.owner)) return false
        if (filters.status && t.status !== filters.status) return false
        if (search && !t.title.toLowerCase().includes(search) && !p.name.toLowerCase().includes(search)) return false
        return true
      })
    })).filter(p => p.tasks.length > 0 || !active)
  }, [projects, filters])

  const totals = useMemo(() => ({
    tasks: projects.reduce((n, p) => n + p.tasks.length, 0),
    projects: projects.length
  }), [projects])

  const me = members.find(m => m.name === currentUser)

  if (locked) return <PasswordGate onUnlock={() => { setLoading(true); loadData().finally(() => setLoading(false)) }} />
  if (loading) return <div className="center-screen">Loading…</div>
  if (!currentUser) return <NamePicker members={members} onPick={pickUser} />

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-title">
          <h1>Marketing Task Dashboard</h1>
          <span className="stats">{totals.tasks} tasks across {totals.projects} projects and {members.length} teammates</span>
        </div>

        <nav className="tabs">
          <button className={`tab ${view === 'dashboard' ? 'tab-active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={`tab ${view === 'projects' ? 'tab-active' : ''}`} onClick={() => setView('projects')}>Projects</button>
          <button className={`tab ${view === 'calendar' ? 'tab-active' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
        </nav>

        <div className="topbar-controls">
          <button className="btn btn-primary" onClick={addProject}>+ New Project</button>

          <div className="bell-wrap">
            <button className="icon-btn" title="Notifications" onClick={() => setNotifOpen(o => !o)}>
              🔔{notifs.unread > 0 && <span className="bell-badge">{notifs.unread}</span>}
            </button>
            {notifOpen && (
              <NotificationsPanel
                notifications={notifs.notifications}
                onMarkAll={markAllRead}
                onMarkOne={markOneRead}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </div>

          <button className="icon-btn" title="Toggle light/dark theme" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className="user-menu-wrap" ref={userMenuRef}>
            <button className="user-chip" onClick={() => setUserMenuOpen(o => !o)} title="Switch profile">
              <span className="avatar">{currentUser[0]}</span>
              {currentUser}
              {me?.role === 'manager' && <span className="role-badge">Manager</span>}
              <span className="caret">▾</span>
            </button>
            {userMenuOpen && (
              <div className="user-menu">
                <div className="user-menu-title">Switch profile</div>
                {members.map(m => (
                  <button
                    key={m.id}
                    className={`user-menu-item ${m.name === currentUser ? 'user-menu-current' : ''}`}
                    onClick={() => pickUser(m.name)}
                  >
                    <span className="avatar">{m.name[0]}</span>
                    {m.name}
                    {m.role === 'manager' && <span className="role-badge">Manager</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error} <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="content">
        {view === 'dashboard' && (
          <Dashboard
            projects={projects}
            members={members}
            highlightTaskIds={highlightTaskIds}
            onAddTask={setTaskFormProjectId}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onOpenComments={setCommentsTask}
            onDeleteProject={id => deleteProject(projects.find(p => p.id === id))}
          />
        )}
        {view === 'calendar' && (
          <CalendarView projects={projects} members={members} onOpenComments={setCommentsTask} />
        )}
        {view === 'projects' && (
          <>
            <div className="projects-toolbar">
              <div className="scope-toggle">
                <button className={`chip ${filters.owner === currentUser ? 'chip-active' : ''}`} onClick={() => setFilters(f => ({ ...f, owner: currentUser }))}>My tasks</button>
                <button className={`chip ${filters.owner === '' ? 'chip-active' : ''}`} onClick={() => setFilters(f => ({ ...f, owner: '' }))}>Everyone</button>
              </div>
              <input
                className="search"
                placeholder="Search tasks or projects…"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />
              <select value={filters.owner} onChange={e => setFilters(f => ({ ...f, owner: e.target.value }))}>
                <option value="">All owners</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
              <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {filtered.map(project => (
              <ProjectGroup
                key={project.id}
                project={project}
                members={members}
                highlightTaskIds={highlightTaskIds}
                onRename={renameProject}
                onDelete={() => deleteProject(project)}
                onAddTask={() => addTask(project.id)}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onOpenComments={setCommentsTask}
              />
            ))}
            {filtered.length === 0 && <div className="empty">No tasks match the current filters.</div>}
          </>
        )}
      </main>

      {commentsTask && (
        <CommentsPanel
          task={commentsTask}
          currentUser={currentUser}
          onClose={() => setCommentsTask(null)}
          onCommentAdded={onCommentAdded}
        />
      )}

      {modal && <Modal modal={modal} onClose={() => setModal(null)} />}

      {taskFormProjectId && (
        <TaskFormModal
          projectName={projects.find(p => p.id === taskFormProjectId)?.name}
          members={members}
          onSubmit={form => addTaskWithDetails(taskFormProjectId, form).catch(e => setError(e.message))}
          onClose={() => setTaskFormProjectId(null)}
        />
      )}
    </div>
  )
}
