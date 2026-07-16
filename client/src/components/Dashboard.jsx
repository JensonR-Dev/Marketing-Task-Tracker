import { useMemo, useState } from 'react'
import {
  STATUSES, STATUS_CLASS, STATUS_COLORS, OVERDUE_COLOR, DATE_FIELDS,
  formatDate, isOverdue
} from '../constants.js'

const EMPTY_FILTERS = {
  projects: [], teammates: [], statuses: [],
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

function StackedBar({ counts, max, total }) {
  const width = max ? (total / max) * 100 : 0
  return (
    <div className="hbar-track">
      <div className="hbar" style={{ width: `${width}%` }}>
        {STATUSES.map(s => counts[s] > 0 && (
          <span
            key={s}
            className="hbar-seg"
            style={{ flex: counts[s], background: STATUS_COLORS[s] }}
            title={`${s}: ${counts[s]}`}
          />
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

export default function Dashboard({ projects, members, highlightTaskIds }) {
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

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    inProgress: tasks.filter(t => t.status === 'In progress').length,
    notStarted: tasks.filter(t => t.status === 'Not yet started').length,
    overdue: tasks.filter(isOverdue).length
  }), [tasks])

  const statusCounts = useMemo(() => countByStatus(tasks), [tasks])

  const byMember = useMemo(() => {
    const rows = members.map(m => {
      const mine = tasks.filter(t => t.owners.includes(m.name))
      return { name: m.name, total: mine.length, counts: countByStatus(mine) }
    })
    return rows.sort((a, b) => b.total - a.total)
  }, [tasks, members])

  const byProject = useMemo(() => {
    const rows = projects.map(p => {
      const mine = tasks.filter(t => t.project === p.name)
      return { name: p.name, total: mine.length, counts: countByStatus(mine) }
    })
    return rows.sort((a, b) => b.total - a.total)
  }, [tasks, projects])

  const maxMember = Math.max(1, ...byMember.map(r => r.total))
  const maxProject = Math.max(1, ...byProject.map(r => r.total))
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

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

      {/* ---- stat cards ---- */}
      <div className="stat-cards">
        <div className="panel stat-card"><span className="stat-num">{stats.total}</span><span className="stat-label">Total tasks</span></div>
        <div className="panel stat-card"><span className="stat-num" style={{ color: STATUS_COLORS.Completed }}>{stats.completed}</span><span className="stat-label">Completed</span></div>
        <div className="panel stat-card"><span className="stat-num" style={{ color: STATUS_COLORS['In progress'] }}>{stats.inProgress}</span><span className="stat-label">In progress</span></div>
        <div className="panel stat-card"><span className="stat-num">{stats.notStarted}</span><span className="stat-label">Not yet started</span></div>
        <div className="panel stat-card"><span className="stat-num" style={{ color: OVERDUE_COLOR }}>{stats.overdue}</span><span className="stat-label">Overdue</span></div>
      </div>

      {/* ---- status overview ---- */}
      <section className="panel">
        <h3 className="panel-title">Status overview</h3>
        <div className="legend">
          {STATUSES.map(s => statusCounts[s] > 0 && (
            <span key={s} className="legend-item"><span className="legend-swatch" style={{ background: STATUS_COLORS[s] }} />{s} ({statusCounts[s]})</span>
          ))}
          {stats.overdue > 0 && <span className="legend-item"><span className="legend-swatch" style={{ background: OVERDUE_COLOR }} />Overdue ({stats.overdue})</span>}
        </div>
        <div className="overview-bar">
          {STATUSES.map(s => {
            const pct = stats.total ? (statusCounts[s] / stats.total) * 100 : 0
            return pct > 0 && (
              <div key={s} className="overview-seg" style={{ width: `${pct}%`, background: STATUS_COLORS[s] }} title={`${s}: ${statusCounts[s]}`}>
                {pct >= 7 && `${Math.round(pct)}%`}
              </div>
            )
          })}
          {stats.total === 0 && <div className="overview-empty">No tasks match the filters</div>}
        </div>
      </section>

      {/* ---- charts ---- */}
      <div className="chart-grid">
        <section className="panel">
          <h3 className="panel-title">Workload by teammate</h3>
          <div className="hbar-rows">
            {byMember.map(r => (
              <div key={r.name} className="hbar-row">
                <span className="hbar-name">{r.name}</span>
                <StackedBar counts={r.counts} max={maxMember} total={r.total} />
                <span className="hbar-count">{r.total}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h3 className="panel-title">Tasks by project</h3>
          <div className="hbar-rows">
            {byProject.map(r => (
              <div key={r.name} className="hbar-row">
                <span className="hbar-name" title={r.name}>{r.name}</span>
                <StackedBar counts={r.counts} max={maxProject} total={r.total} />
                <span className="hbar-count">{r.total}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ---- task list ---- */}
      <section className="panel">
        <h3 className="panel-title">Task list</h3>
        <p className="panel-sub">Showing {tasks.length} of {allTasks.length} tasks — switch to the Projects tab to edit</p>
        <div className="table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th>Project</th><th>Task</th><th>Owner</th><th>Assigned by</th><th>Status</th>
                <th>Reviewed?</th><th>Assigned date</th><th>Start date</th><th>End date</th>
                <th>Expected go-live</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const overdue = isOverdue(t)
                return (
                  <tr key={t.id} className={`${overdue ? 'list-overdue' : ''} ${highlightTaskIds.has(t.id) ? 'list-highlight' : ''}`}>
                    <td>{t.project}</td>
                    <td className="list-task">{t.title}</td>
                    <td>{t.owners.join(', ') || '—'}</td>
                    <td>{t.assigned_by || '—'}</td>
                    <td>
                      <span className={`status-pill-static ${STATUS_CLASS[t.status]}`}>● {t.status}</span>
                      {overdue && <div className="overdue-note">● Overdue</div>}
                    </td>
                    <td>{t.reviewed ? 'Yes' : '—'}</td>
                    <td>{formatDate(t.assigned_date) || '—'}</td>
                    <td>{formatDate(t.start_date) || '—'}</td>
                    <td>{formatDate(t.end_date) || '—'}</td>
                    <td>{formatDate(t.golive_date) || '—'}</td>
                    <td>{t.notes || '—'}</td>
                  </tr>
                )
              })}
              {tasks.length === 0 && <tr><td colSpan="11" className="empty-row">No tasks match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
