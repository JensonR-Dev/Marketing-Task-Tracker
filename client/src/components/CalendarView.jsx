import { useMemo, useState } from 'react'
import { DATE_FIELDS, STATUS_COLORS, STATUS_CLASS, isOverdue } from '../constants.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS = 3

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarView({ projects, members, onOpenComments }) {
  const today = new Date()
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [dateField, setDateField] = useState('golive_date')
  const [owner, setOwner] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)

  const tasks = useMemo(
    () => projects.flatMap(p => p.tasks.map(t => ({ ...t, project: p.name }))),
    [projects]
  )

  const byDate = useMemo(() => {
    const map = {}
    for (const t of tasks) {
      if (owner && !t.owners.includes(owner)) continue
      const d = t[dateField]
      if (!d) continue
      if (!map[d]) map[d] = []
      map[d].push(t)
    }
    return map
  }, [tasks, dateField, owner])

  const unscheduled = useMemo(
    () => tasks.filter(t => (!owner || t.owners.includes(owner)) && !t[dateField]).length,
    [tasks, dateField, owner]
  )

  // 6-week grid starting on the Monday of the week containing the 1st
  const cells = useMemo(() => {
    const startOffset = (month.getDay() + 6) % 7
    const start = new Date(month)
    start.setDate(1 - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [month])

  function shiftMonth(delta) {
    setMonth(m => new Date(m.getFullYear(), m.getMonth() + delta, 1))
    setSelectedDate(null)
  }

  const monthLabel = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const todayKey = toKey(today)
  const selectedTasks = selectedDate ? byDate[selectedDate] || [] : []
  const fieldLabel = DATE_FIELDS.find(f => f.value === dateField)?.label

  return (
    <div className="calendar">
      <section className="panel">
        <div className="cal-toolbar">
          <div className="cal-nav">
            <button className="btn btn-outline" onClick={() => shiftMonth(-1)}>‹</button>
            <h3 className="cal-month">{monthLabel}</h3>
            <button className="btn btn-outline" onClick={() => shiftMonth(1)}>›</button>
            <button className="btn btn-ghost" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(todayKey) }}>Today</button>
          </div>
          <div className="cal-controls">
            <select value={dateField} onChange={e => { setDateField(e.target.value); setSelectedDate(null) }}>
              {DATE_FIELDS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select value={owner} onChange={e => setOwner(e.target.value)}>
              <option value="">All teammates</option>
              {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="cal-grid">
          {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
          {cells.map(d => {
            const key = toKey(d)
            const dayTasks = byDate[key] || []
            const inMonth = d.getMonth() === month.getMonth()
            const classes = ['cal-cell']
            if (!inMonth) classes.push('cal-dim')
            if (key === todayKey) classes.push('cal-today')
            if (key === selectedDate) classes.push('cal-selected')
            return (
              <button
                key={key}
                className={classes.join(' ')}
                onClick={() => setSelectedDate(key === selectedDate ? null : key)}
              >
                <span className="cal-daynum">{d.getDate()}</span>
                <span className="cal-chips">
                  {dayTasks.slice(0, MAX_CHIPS).map(t => (
                    <span key={t.id} className="cal-chip" title={`${t.title} — ${t.owners.join(', ')}`}>
                      <span className="cal-dot" style={{ background: STATUS_COLORS[t.status] }} />
                      {t.title}
                    </span>
                  ))}
                  {dayTasks.length > MAX_CHIPS && (
                    <span className="cal-more">+{dayTasks.length - MAX_CHIPS} more</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
        {unscheduled > 0 && (
          <p className="cal-note">{unscheduled} task{unscheduled === 1 ? '' : 's'} have no {fieldLabel} date and aren't shown.</p>
        )}
      </section>

      {selectedDate && (
        <section className="panel">
          <h3 className="panel-title">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' — '}{selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'} ({fieldLabel})
          </h3>
          {selectedTasks.length === 0 && <p className="cal-note">Nothing scheduled on this day.</p>}
          <div className="cal-day-list">
            {selectedTasks.map(t => (
              <div key={t.id} className="cal-day-task">
                <div className="cal-day-main">
                  <strong>{t.title}</strong>
                  <span className="cal-day-project">{t.project}</span>
                </div>
                <span className="cal-day-owners">{t.owners.join(', ') || '—'}</span>
                <span className={`status-pill-static ${STATUS_CLASS[t.status]}`}>● {t.status}</span>
                {isOverdue(t) && <span className="overdue-badge">Overdue</span>}
                <button className="btn btn-ghost" title="Comments" onClick={() => onOpenComments(t)}>
                  💬{t.comment_count > 0 && <span className="comment-count">{t.comment_count}</span>}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
