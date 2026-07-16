import { useEffect, useState } from 'react'
import OwnerSelect from './OwnerSelect.jsx'
import { STATUSES, STATUS_CLASS, isOverdue } from '../constants.js'

function DateCell({ value, onChange }) {
  return (
    <input
      type="date"
      className="date-input"
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
    />
  )
}

export default function TaskRow({ task, members, highlighted, onUpdate, onDelete, onOpenComments }) {
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [notesDraft, setNotesDraft] = useState(task.notes || '')

  useEffect(() => setTitleDraft(task.title), [task.title])
  useEffect(() => setNotesDraft(task.notes || ''), [task.notes])

  const overdue = isOverdue(task)

  return (
    <tr className={`${overdue ? 'row-overdue' : ''} ${highlighted ? 'row-highlight' : ''}`}>
      <td className="col-title">
        <input
          className="cell-input"
          value={titleDraft}
          onChange={e => setTitleDraft(e.target.value)}
          onBlur={() => { if (titleDraft.trim() && titleDraft !== task.title) onUpdate({ title: titleDraft.trim() }) }}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
        />
      </td>
      <td>
        <OwnerSelect owners={task.owners} members={members} onChange={owners => onUpdate({ owners })} />
      </td>
      <td>
        <select
          className="cell-select"
          value={task.assigned_by || ''}
          onChange={e => onUpdate({ assigned_by: e.target.value || null })}
        >
          <option value="">—</option>
          {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
        </select>
      </td>
      <td>
        <select
          className={`status-pill ${STATUS_CLASS[task.status] || ''}`}
          value={task.status}
          onChange={e => onUpdate({ status: e.target.value })}
        >
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td className="col-check">
        <input
          type="checkbox"
          checked={task.reviewed}
          onChange={e => onUpdate({ reviewed: e.target.checked })}
        />
      </td>
      <td><DateCell value={task.assigned_date} onChange={v => onUpdate({ assigned_date: v })} /></td>
      <td><DateCell value={task.start_date} onChange={v => onUpdate({ start_date: v })} /></td>
      <td><DateCell value={task.end_date} onChange={v => onUpdate({ end_date: v })} /></td>
      <td>
        <div className="golive-cell">
          <DateCell value={task.golive_date} onChange={v => onUpdate({ golive_date: v })} />
          {overdue && <span className="overdue-badge" title="Past expected go-live date">Overdue</span>}
        </div>
      </td>
      <td className="col-notes">
        <input
          className="cell-input"
          value={notesDraft}
          placeholder="—"
          onChange={e => setNotesDraft(e.target.value)}
          onBlur={() => { if (notesDraft !== (task.notes || '')) onUpdate({ notes: notesDraft }) }}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
        />
      </td>
      <td className="col-actions">
        <button className="btn btn-ghost" onClick={onOpenComments} title="Comments">
          💬{task.comment_count > 0 && <span className="comment-count">{task.comment_count}</span>}
        </button>
        <button className="btn btn-ghost btn-danger" onClick={onDelete} title="Delete task">✕</button>
      </td>
    </tr>
  )
}
