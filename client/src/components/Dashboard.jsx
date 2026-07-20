import { useMemo, useState } from 'react'
import {
  STATUSES, STATUS_COLORS, OVERDUE_COLOR, DATE_FIELDS,
  isOverdue
} from '../constants.js'
import TaskRow from './TaskRow.jsx'

const EMPTY_FILTERS = {
  projects: [], teammates: [], statuses: [], overdueOnly: false,
  dateField: 'golive_date', from: '', to: '', search: ''
}

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div className="chip-group">
      <span className="chip-label">{label}</span>
      <div className="chips">
        {options.map(o => (
          <button
            key={o}
            className={`chip ${selected.includes(o) ? 'chip-active' : ''}`}
            onClick={() => onToggle(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

function countByStatus(tasks) {
  const counts = {}
  for (const s of STATUSES) counts[s] = 0
  for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1
  return counts
}

function TaskListGroup({ id, name, tasks, members, highlightTaskIds, onAddTask, onUpdateTask, onDeleteTask, onOpenComments, onDeleteProject }) {
  const [collapsed, setCollapsed] = useState(true)
  return (
    <div className="list-group">
      <div className="list-group-header">
        <button className="list-group-toggle" onClick={() => setCollapsed(c => !c)}>
          <span className="collapse-btn">{collapsed ? '▸' : '▾'}</span>
          <strong>{name}</strong>
          <span className="task-count">{tasks.length} task{tasks.length === 1 ? '' : 's'}</span>
        </button>
        <div className="list-group-actions">
          <button className="btn btn-ghost list-add-task" onClick={() => onAddTask(id)}>+ Add task</button>
          <button className="btn btn-ghost btn-danger" onClick={() => onDeleteProject(id)}>Delete</button>
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
              {tasks.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  members={members}
                  highlighted={highlightTaskIds.has(t.id)}
                  onUpdate={patch => onUpdateTask(t.id, patch)}
                  onDelete={() => onDeleteTask(t)}
                  onOpenComments={() => onOpenComments(t)}
                />
              ))}
              {tasks.length === 0 && <tr><td colSpan="11" className="empty-row">No tasks yet — click "+ Add task".</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ projects, members, highlightTaskIds, onAddTask, onUpdateTask, onDeleteTask, onOpenComments, onDeleteProject }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const allTasks = useMemo(
    () => projects.flatMap(p => p.tasks.map(t => ({ ...t, project: p.name }))),
    [projects]
  )

  const tasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return allTasks.filter(t => {
      if (filters.projects.length && !filters.projects.includes(t.project)) return false
      if (filters.teammates.length && !t.owners.some(o => filters.teammates.includes(o))) return false
      if (filters.statuses.length && !filters.statuses.includes(t.status)) return false
      if (filters.overdueOnly && !isOverdue(t)) return false
      if (filters.from || filters.to) {
        const v = t[filters.dateField]
        if (!v) return false
        if (filters.from && v < filters.from) return false
        if (filters.to && v > filters.to) return false
      }
      if (search) {
        const haystack = `${t.title} ${t.notes || ''} ${t.project}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })
  }, [allTasks, filters])

  function toggle(key, value) {
    setFilters(f => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value]
    }))
  }

  // click a status (card / bar / legend) -> filter the task list to it
  function selectStatus(status) {
    setFilters(f => ({
      ...f,
      overdueOnly: false,
      statuses: f.statuses.length === 1 && f.statuses[0] === status && !f.overdueOnly ? [] : [status]
    }))
  }

  function selectOverdue() {
    setFilters(f => ({ ...f, statuses: [], overdueOnly: !f.overdueOnly }))
  }

  function selectAll() {
    setFilters(f => ({ ...f, statuses: [], overdueOnly: false }))
  }

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    inProgress: tasks.filter(t => t.status === 'In progress').length,
    notStarted: tasks.filter(t => t.status === 'Not yet started').length,
    overdue: tasks.filter(isOverdue).length
  }), [tasks])

  const statusCounts = useMemo(() => countByStatus(tasks), [tasks])
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  const grouped = useMemo(() =>
    projects
      .map(p => ({ id: p.id, name: p.name, tasks: tasks.filter(t => t.project_id === p.id) }))
      .filter(g => g.tasks.length > 0 || !isFiltered),
  [projects, tasks, isFiltered])

  const statusIs = s => filters.statuses.length === 1 && filters.statuses[0] === s && !filters.overdueOnly

  return (
    <div className="dashboard">
      {/* ---- filters ---- */}
      <section className="panel filter-panel">
        <div className="panel-title-row">
          <h3 className="panel-title">Filters</h3>
          {isFiltered && <button className="btn btn-outline" onClick={() => setFilters(EMPTY_FILTERS)}>Reset filters</button>}
        </div>
        <div className="filter-chips-row">
          <ChipGroup label="Project" options={projects.map(p => p.name)} selected={filters.projects} onToggle={v => toggle('projects', v)} />
          <ChipGroup label="Teammate" options={members.map(m => m.name)} selected={filters.teammates} onToggle={v => toggle('teammates', v)} />
          <ChipGroup label="Status" options={STATUSES} selected={filters.statuses} onToggle={v => toggle('statuses', v)} />
        </div>
        <div className="filter-bottom-row">
          <div className="filter-field">
            <span className="chip-label">Date field</span>
            <select value={filters.dateField} onChange={e => setFilters(f => ({ ...f, dateField: e.target.value }))}>
              {DATE_FIELDS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="filter-field">
            <span className="chip-label">Date range</span>
            <div className="date-range">
              <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
              <span className="range-to">to</span>
              <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
            </div>
          </div>
          <div className="filter-field filter-search">
            <span className="chip-label">Search</span>
            <input placeholder="Task or notes…" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
        </div>
      </section>

      {/* ---- stat cards (click to filter the list below) ---- */}
      <div className="stat-cards">
        <button className={`panel stat-card ${!filters.statuses.length && !filters.overdueOnly ? 'stat-active' : ''}`} onClick={selectAll}>
          <span className="stat-num">{stats.total}</span><span className="stat-label">Total tasks</span>
        </button>
        <button className={`panel stat-card ${statusIs('Completed') ? 'stat-active' : ''}`} onClick={() => selectStatus('Completed')}>
          <span className="stat-num" style={{ color: STATUS_COLORS.Completed }}>{stats.completed}</span><span className="stat-label">Completed</span>
        </button>
        <button className={`panel stat-card ${statusIs('In progress') ? 'stat-active' : ''}`} onClick={() => selectStatus('In progress')}>
          <span className="stat-num" style={{ color: STATUS_COLORS['In progress'] }}>{stats.inProgress}</span><span className="stat-label">In progress</span>
        </button>
        <button className={`panel stat-card ${statusIs('Not yet started') ? 'stat-active' : ''}`} onClick={() => selectStatus('Not yet started')}>
          <span className="stat-num">{stats.notStarted}</span><span className="stat-label">Not yet started</span>
        </button>
        <button className={`panel stat-card ${filters.overdueOnly ? 'stat-active' : ''}`} onClick={selectOverdue}>
          <span className="stat-num" style={{ color: OVERDUE_COLOR }}>{stats.overdue}</span><span className="stat-label">Overdue</span>
        </button>
      </div>

      {/* ---- status overview (segments clickable too) ---- */}
      <section className="panel">
        <h3 className="panel-title">Status overview — click a status to see its tasks</h3>
        <div className="legend">
          {STATUSES.map(s => statusCounts[s] > 0 && (
            <button key={s} className={`legend-item ${statusIs(s) ? 'legend-active' : ''}`} onClick={() => selectStatus(s)}>
              <span className="legend-swatch" style={{ background: STATUS_COLORS[s] }} />{s} ({statusCounts[s]})
            </button>
          ))}
          {stats.overdue > 0 && (
            <button className={`legend-item ${filters.overdueOnly ? 'legend-active' : ''}`} onClick={selectOverdue}>
              <span className="legend-swatch" style={{ background: OVERDUE_COLOR }} />Overdue ({stats.overdue})
            </button>
          )}
        </div>
        <div className="overview-bar">
          {STATUSES.map(s => {
            const pct = stats.total ? (statusCounts[s] / stats.total) * 100 : 0
            return pct > 0 && (
              <button key={s} className="overview-seg" style={{ width: `${pct}%`, background: STATUS_COLORS[s] }}
                title={`${s}: ${statusCounts[s]} — click to filter`} onClick={() => selectStatus(s)}>
                {pct >= 7 && `${Math.round(pct)}%`}
              </button>
            )
          })}
          {stats.total === 0 && <div className="overview-empty">No tasks match the filters</div>}
        </div>
      </section>

      {/* ---- task list, grouped per project ---- */}
      <section className="panel">
        <h3 className="panel-title">Task list</h3>
        <p className="panel-sub">Showing {tasks.length} of {allTasks.length} tasks — click any field to edit</p>
        {grouped.map(g => (
          <TaskListGroup
            key={g.id}
            id={g.id}
            name={g.name}
            tasks={g.tasks}
            members={members}
            highlightTaskIds={highlightTaskIds}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onOpenComments={onOpenComments}
            onDeleteProject={onDeleteProject}
          />
        ))}
        {grouped.length === 0 && <div className="empty">No tasks match the current filters.</div>}
      </section>
    </div>
  )
}
