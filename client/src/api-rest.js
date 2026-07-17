// REST backend: talks to the local Express + SQLite server (office version).
async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user': localStorage.getItem('tracker-user') || '',
      'x-team-key': localStorage.getItem('tracker-key') || '',
      ...options.headers
    }
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export const api = {
  login: password => request('/api/login', { method: 'POST', body: JSON.stringify({ password }) }),
  async hasSession() {
    try {
      await this.login(localStorage.getItem('tracker-key') || '')
      return true
    } catch {
      return false
    }
  },
  bootstrap: () => request('/api/bootstrap'),
  createProject: name => request('/api/projects', { method: 'POST', body: JSON.stringify({ name }) }),
  renameProject: (id, name) => request(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteProject: id => request(`/api/projects/${id}`, { method: 'DELETE' }),
  createTask: (projectId, data) => request(`/api/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: id => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  getComments: taskId => request(`/api/tasks/${taskId}/comments`),
  addComment: (taskId, author, text) =>
    request(`/api/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ author, text }) }),
  getNotifications: () => request('/api/notifications'),
  markNotificationsRead: payload =>
    request('/api/notifications/read', { method: 'POST', body: JSON.stringify(payload) })
}
