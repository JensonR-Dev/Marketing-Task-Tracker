import { supabase, TEAM_EMAIL } from './supabase.js'

const user = () => localStorage.getItem('tracker-user') || ''

function fail(error) {
  throw new Error(error.message || 'Request failed')
}

// insert notification rows for everyone in `recipients` except the actor
async function notify(recipients, taskId, type, message) {
  const actor = user()
  const rows = [...new Set(recipients)]
    .filter(r => r && r !== actor)
    .map(recipient => ({ recipient, actor: actor || null, task_id: taskId, type, message }))
  if (rows.length) await supabase.from('notifications').insert(rows)
}

async function commentCount(taskId) {
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId)
  return count ?? 0
}

export const api = {
  // ---- auth ----
  async hasSession() {
    const { data } = await supabase.auth.getSession()
    return !!data.session
  },

  async login(password) {
    const { error } = await supabase.auth.signInWithPassword({ email: TEAM_EMAIL, password })
    if (error) fail(error)
    return { ok: true }
  },

  // ---- bootstrap ----
  async bootstrap() {
    const [m, p, t] = await Promise.all([
      supabase.from('members').select('*').order('name'),
      supabase.from('projects').select('*').order('sort_order').order('id'),
      supabase.from('tasks').select('*, comments(count)').order('sort_order').order('id')
    ])
    if (m.error) fail(m.error)
    if (p.error) fail(p.error)
    if (t.error) fail(t.error)
    const tasks = t.data.map(({ comments, ...task }) => ({
      ...task,
      comment_count: comments?.[0]?.count ?? 0
    }))
    const projects = p.data.map(proj => ({
      ...proj,
      tasks: tasks.filter(x => x.project_id === proj.id)
    }))
    return { members: m.data, projects }
  },

  // ---- projects ----
  async createProject(name) {
    const { data: maxRows } = await supabase
      .from('projects').select('sort_order')
      .order('sort_order', { ascending: false }).limit(1)
    const sort_order = (maxRows?.[0]?.sort_order ?? -1) + 1
    const { data, error } = await supabase
      .from('projects').insert({ name, sort_order }).select().single()
    if (error) fail(error)
    return { ...data, tasks: [] }
  },

  async renameProject(id, name) {
    const { error } = await supabase.from('projects').update({ name }).eq('id', id)
    if (error) fail(error)
    return { ok: true }
  },

  async deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) fail(error)
    return { ok: true }
  },

  // ---- tasks ----
  async createTask(projectId, data) {
    const { data: proj, error: projError } = await supabase
      .from('projects').select('name').eq('id', projectId).single()
    if (projError) fail(projError)
    const { data: maxRows } = await supabase
      .from('tasks').select('sort_order').eq('project_id', projectId)
      .order('sort_order', { ascending: false }).limit(1)
    const owners = data.owners || []
    const { data: task, error } = await supabase.from('tasks').insert({
      project_id: projectId,
      title: (data.title || '').trim() || 'New task',
      owners,
      assigned_by: data.assigned_by || user() || null,
      status: data.status || 'Not yet started',
      sort_order: (maxRows?.[0]?.sort_order ?? -1) + 1
    }).select().single()
    if (error) fail(error)
    await notify(owners, task.id, 'assigned',
      `${user() || 'Someone'} assigned you "${task.title}" in ${proj.name}`)
    return { ...task, comment_count: 0 }
  },

  async updateTask(id, patch) {
    const FIELDS = ['title', 'owners', 'assigned_by', 'status', 'reviewed',
      'assigned_date', 'start_date', 'end_date', 'golive_date', 'notes']
    const updates = {}
    for (const f of FIELDS) {
      if (!(f in patch)) continue
      updates[f] = patch[f] === '' ? null : patch[f]
    }

    let oldOwners = null
    if ('owners' in updates) {
      const { data: prev } = await supabase.from('tasks').select('owners').eq('id', id).single()
      oldOwners = prev?.owners || []
    }

    const { data: task, error } = await supabase
      .from('tasks').update(updates).eq('id', id).select().single()
    if (error) fail(error)

    if (oldOwners) {
      const added = (updates.owners || []).filter(o => !oldOwners.includes(o))
      if (added.length) {
        const { data: proj } = await supabase
          .from('projects').select('name').eq('id', task.project_id).single()
        await notify(added, task.id, 'assigned',
          `${user() || 'Someone'} assigned you "${task.title}" in ${proj?.name || 'a project'}`)
      }
    }

    return { ...task, comment_count: await commentCount(id) }
  },

  async deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) fail(error)
    return { ok: true }
  },

  // ---- comments ----
  async getComments(taskId) {
    const { data, error } = await supabase
      .from('comments').select('*').eq('task_id', taskId).order('id')
    if (error) fail(error)
    return data
  },

  async addComment(taskId, author, text) {
    const { data: task } = await supabase
      .from('tasks').select('title, owners').eq('id', taskId).single()
    const { data: comment, error } = await supabase
      .from('comments').insert({ task_id: taskId, author, text }).select().single()
    if (error) fail(error)
    await notify(task?.owners || [], taskId, 'comment',
      `${author} commented on "${task?.title || 'a task'}"`)
    return comment
  },

  // ---- notifications ----
  async getNotifications() {
    const u = user()
    if (!u) return { notifications: [], unread: 0 }
    const { data, error } = await supabase
      .from('notifications').select('*').eq('recipient', u)
      .order('id', { ascending: false }).limit(50)
    if (error) fail(error)
    return { notifications: data, unread: data.filter(n => !n.is_read).length }
  },

  async markNotificationsRead(payload) {
    const u = user()
    let query = supabase.from('notifications').update({ is_read: true }).eq('recipient', u)
    if (!payload.all) query = query.in('id', payload.ids || [])
    const { error } = await query
    if (error) fail(error)
    return { ok: true }
  }
}
