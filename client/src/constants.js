export const STATUSES = [
  'Not yet started',
  'In progress',
  'In review',
  'On hold',
  'Completed'
]

export const STATUS_CLASS = {
  'Not yet started': 'status-notstarted',
  'In progress': 'status-inprogress',
  'In review': 'status-inreview',
  'On hold': 'status-onhold',
  'Completed': 'status-completed'
}

// chart segment colors (work on both themes)
export const STATUS_COLORS = {
  'Not yet started': '#8b909a',
  'In progress': '#3b82f6',
  'In review': '#f59e0b',
  'On hold': '#ec4899',
  'Completed': '#22c55e'
}

export const OVERDUE_COLOR = '#ef4444'

export const DATE_FIELDS = [
  { value: 'golive_date', label: 'Expected go-live' },
  { value: 'assigned_date', label: 'Assigned date' },
  { value: 'start_date', label: 'Start date' },
  { value: 'end_date', label: 'End date' }
]

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function isOverdue(task) {
  if (!task.golive_date || task.status === 'Completed') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(task.golive_date + 'T00:00:00') < today
}

// handles both SQLite UTC strings ("2026-07-16 10:00:00") and
// Postgres timestamptz ISO strings ("2026-07-16T10:00:00+00:00")
export function parseTimestamp(ts) {
  if (!ts) return new Date(0)
  return new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(ts) ? ts : ts + 'Z')
}

export function timeAgo(isoUtc) {
  const then = parseTimestamp(isoUtc)
  const mins = Math.floor((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return then.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
