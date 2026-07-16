import Database from 'better-sqlite3'

const db = new Database('C:/Users/Jenson.r/team-tracker/data/tracker.db')

const exists = db.prepare("SELECT id FROM projects WHERE name = 'Breakfast event'").get()
if (exists) {
  console.log('Breakfast event project already exists, skipping.')
  process.exit(0)
}

const TASKS = [
  { title: 'Theme confirmation', owners: ['Aswini'], assigned_by: 'Aswini', status: 'In progress', assigned_date: '2026-07-10', start_date: '2026-07-12', end_date: '2026-07-15', golive_date: '2026-07-15' },
  { title: 'LinkedIn Ad strategy', owners: ['Nirmal'], assigned_by: 'Nived', status: 'In progress', assigned_date: '2026-07-10', golive_date: '2026-07-15' },
  { title: 'Email Strategy', owners: ['Nizam'], assigned_by: 'Nived', status: 'Completed', reviewed: 1, assigned_date: '2026-07-10', start_date: '2026-07-13', end_date: '2026-07-13', golive_date: '2026-07-14', notes: 'Done' },
  { title: 'Event space confirmation', owners: ['Nived'], status: 'In progress', assigned_date: '2026-07-10', start_date: '2026-07-13', golive_date: '2026-07-23' },
  { title: 'Audio/video setup at venue', owners: ['Nived'], status: 'In progress', assigned_date: '2026-07-10', start_date: '2026-07-13', golive_date: '2026-07-23' },
  { title: 'LinkedIn Ads setup', owners: ['Nirmal'], status: 'Not yet started', assigned_date: '2026-07-10', golive_date: '2026-07-24' },
  { title: 'Content for email', owners: ['Samiksha'], status: 'Not yet started', assigned_date: '2026-07-10', golive_date: '2026-07-24' },
  { title: 'Videos for Organic LinkedIn', owners: ['Manoj'], status: 'Not yet started', assigned_date: '2026-07-10', golive_date: '2026-07-27' },
  { title: 'Goodies for Attendees', owners: ['Manoj'], status: 'In progress', assigned_date: '2026-07-10', start_date: '2026-07-13', golive_date: '2026-08-12' },
  { title: 'ID card for attendees', owners: ['Manoj'], status: 'Not yet started', assigned_date: '2026-07-10', golive_date: '2026-08-12' },
  { title: 'Mementos for speaker', owners: ['Manoj'], status: 'Not yet started', assigned_date: '2026-07-10', golive_date: '2026-08-12' },
  { title: 'Creatives for Ad', owners: ['Namitha'], assigned_by: 'Nirmal', status: 'Not yet started', golive_date: '2026-07-23' },
  { title: 'Page Content', owners: ['Aswini'], status: 'In progress', assigned_date: '2026-07-10', start_date: '2026-07-13', end_date: '2026-07-17', golive_date: '2026-07-22' },
  { title: 'Page Development', owners: ['Jenson'], status: 'Not yet started', golive_date: '2026-07-23' },
  { title: 'LinkedIn Organics', owners: ['Samiksha'], status: 'Not yet started', assigned_date: '2026-07-10', golive_date: '2026-07-24' }
]

const insertTask = db.prepare(`
  INSERT INTO tasks (project_id, title, owners, assigned_by, status, reviewed, assigned_date, start_date, end_date, golive_date, notes, sort_order)
  VALUES (@project_id, @title, @owners, @assigned_by, @status, @reviewed, @assigned_date, @start_date, @end_date, @golive_date, @notes, @sort_order)
`)

db.transaction(() => {
  const { lastInsertRowid: projectId } = db.prepare('INSERT INTO projects (name, sort_order) VALUES (?, ?)').run('Breakfast event', -1)
  TASKS.forEach((t, i) => insertTask.run({
    project_id: projectId,
    title: t.title,
    owners: JSON.stringify(t.owners),
    assigned_by: t.assigned_by || null,
    status: t.status,
    reviewed: t.reviewed || 0,
    assigned_date: t.assigned_date || null,
    start_date: t.start_date || null,
    end_date: t.end_date || null,
    golive_date: t.golive_date || null,
    notes: t.notes || null,
    sort_order: i
  }))
})()

console.log('Breakfast event project imported with', TASKS.length, 'tasks.')
