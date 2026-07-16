import { useState } from 'react'
import TaskRow from './TaskRow.jsx'

export default function ProjectGroup({
  project, members, highlightTaskIds,
  onRename, onDelete, onAddTask, onUpdateTask, onDeleteTask, onOpenComments
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(project.name)

  function commitName() {
    setEditingName(false)
    const name = nameDraft.trim()
    if (name && name !== project.name) onRename(project.id, name)
    else setNameDraft(project.name)
  }

  return (
    <section className="project">
      <div className="project-header">
        <button className="collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▸' : '▾'}
        </button>
        {editingName ? (
          <input
            className="project-name-input"
            value={nameDraft}
            autoFocus
            onChange={e => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setNameDraft(project.name); setEditingName(false) } }}
          />
        ) : (
          <h2 className="project-name" onDoubleClick={() => setEditingName(true)} title="Double-click to rename">
            {project.name}
          </h2>
        )}
        <span className="task-count">{project.tasks.length} tasks</span>
        <div className="project-actions">
          <button className="btn btn-ghost" onClick={onAddTask}>+ Add task</button>
          <button className="btn btn-ghost btn-danger" onClick={onDelete} title="Delete project">Delete</button>
        </div>
      </div>

      {!collapsed && (
        <div className="table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th className="col-title">Task</th>
                <th>Owner</th>
                <th>Assigned by</th>
                <th>Status</th>
                <th className="col-check">Reviewed</th>
                <th>Assigned</th>
                <th>Start</th>
                <th>End</th>
                <th>Go-live</th>
                <th className="col-notes">Notes</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {project.tasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  members={members}
                  highlighted={highlightTaskIds.has(task.id)}
                  onUpdate={patch => onUpdateTask(task.id, patch)}
                  onDelete={() => onDeleteTask(task)}
                  onOpenComments={() => onOpenComments(task)}
                />
              ))}
              {project.tasks.length === 0 && (
                <tr><td colSpan="11" className="empty-row">No tasks yet — click “+ Add task”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
