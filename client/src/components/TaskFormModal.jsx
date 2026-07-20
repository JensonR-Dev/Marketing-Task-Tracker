import { useState } from 'react'
import { STATUSES } from '../constants.js'

const EMPTY = {
  title: '', owners: [], assigned_by: '', status: 'Not yet started', reviewed: false,
  assigned_date: '', start_date: '', end_date: '', golive_date: '', notes: ''
}

export default function TaskFormModal({ projectName, members, onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleOwner(name) {
    setForm(f => ({
      ...f,
      owners: f.owners.includes(name) ? f.owners.filter(o => o !== name) : [...f.owners, name]
    }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      await onSubmit({ ...form, title: form.title.trim() })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <form className="modal task-form-modal" onSubmit={submit}>
        <h3>New task {projectName && <span className="task-form-project">in {projectName}</span>}</h3>

        <label className="form-field">
          <span>Task title</span>
          <input
            className="modal-input"
            autoFocus
            placeholder="e.g. Design landing page banner"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Owner(s)</span>
          <div className="form-owner-grid">
            {members.map(m => (
              <label key={m.id} className={`form-owner-pill ${form.owners.includes(m.name) ? 'form-owner-pill-active' : ''}`}>
                <input
                  type="checkbox"
                  checked={form.owners.includes(m.name)}
                  onChange={() => toggleOwner(m.name)}
                />
                {m.name}
              </label>
            ))}
          </div>
        </label>

        <div className="form-row">
          <label className="form-field">
            <span>Assigned by</span>
            <select value={form.assigned_by} onChange={e => set('assigned_by', e.target.value)}>
              <option value="">—</option>
              {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Status</span>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="form-row form-row-4">
          <label className="form-field">
            <span>Assigned date</span>
            <input type="date" value={form.assigned_date} onChange={e => set('assigned_date', e.target.value)} />
          </label>
          <label className="form-field">
            <span>Start date</span>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          </label>
          <label className="form-field">
            <span>End date</span>
            <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          </label>
          <label className="form-field">
            <span>Expected go-live</span>
            <input type="date" value={form.golive_date} onChange={e => set('golive_date', e.target.value)} />
          </label>
        </div>

        <label className="form-field">
          <span>Notes</span>
          <input
            className="modal-input"
            placeholder="Optional notes…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </label>

        <label className="form-checkbox-row">
          <input type="checkbox" checked={form.reviewed} onChange={e => set('reviewed', e.target.checked)} />
          Already reviewed
        </label>

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.title.trim() || saving}>
            {saving ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  )
}
