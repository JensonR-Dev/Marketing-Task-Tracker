// One-time seed: the team roster and the current state of the Excel sheet
// (as of 16-Jul-2026) so the tool starts with real data instead of empty.

const MEMBERS = ['Jenson', 'Aswini', 'Nived', 'Nirmal', 'Manoj', 'Samiksha', 'Namitha', 'Nizam']

const PROJECTS = [
  {
    name: 'Breakfast event',
    tasks: [
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
  },
  {
    name: 'Adapt AI Launch',
    tasks: [
      { title: 'Page Content', owners: ['Aswini'], status: 'In progress', start_date: '2026-07-14', end_date: '2026-07-16', golive_date: '2026-07-16' },
      { title: 'Campaign strategy', owners: ['Nived'], status: 'Not yet started', golive_date: '2026-07-22' },
      { title: 'LinkedIn Ad strategy', owners: ['Nirmal'], status: 'Not yet started', golive_date: '2026-07-21' },
      { title: 'Email Strategy', owners: ['Nizam'], status: 'Not yet started', golive_date: '2026-07-20' },
      { title: 'AdaptAI Artwork - Landing page', owners: ['Manoj'], status: 'In progress', golive_date: '2026-07-17' },
      { title: 'Video for the launch', owners: ['Manoj'], status: 'Not yet started', golive_date: '2026-08-05' },
      { title: 'Page Development', owners: ['Jenson'], status: 'In progress', golive_date: '2026-07-17' }
    ]
  },
  {
    name: 'Packaging Artwork readiness',
    tasks: [
      { title: 'Page Content', owners: ['Samiksha'], assigned_by: 'Jenson', status: 'In progress', golive_date: '2026-07-17' },
      { title: 'Page Development', owners: ['Jenson'], status: 'Not yet started', golive_date: '2026-07-17' }
    ]
  },
  {
    name: 'BAU Task (Business As Usual)',
    tasks: [
      { title: 'Page Creative designs', owners: ['Namitha'], status: 'In progress', golive_date: '2026-07-16' },
      { title: 'Technical SEO', owners: ['Jenson'], status: 'Not yet started', golive_date: '2026-07-24' },
      { title: 'Website Link Redirection', owners: ['Jenson'], status: 'In progress', golive_date: '2026-07-16' },
      { title: 'Help Center website French translation', owners: ['Jenson'], status: 'In progress', golive_date: '2026-07-31' },
      { title: 'LinkedIn Creatives', owners: ['Namitha'], status: 'In progress' },
      { title: 'Playbook', owners: ['Namitha'], status: 'In progress', golive_date: '2026-07-31' },
      { title: 'LinkedIn Organic Copy & Caption', owners: ['Samiksha'], status: 'In progress', end_date: '2026-07-30', golive_date: '2026-07-30' },
      { title: 'Blogs', owners: ['Samiksha', 'Aswini'], status: 'Not yet started' },
      { title: 'MA intro video for DS group', owners: ['Manoj'], status: 'Not yet started' },
      { title: 'EU Artwork - CPG', owners: ['Manoj'], status: 'In progress' },
      { title: 'Cold outreach & nurture Emails', owners: ['Samiksha'], assigned_by: 'Nived', status: 'In progress', notes: 'Email Campaign' },
      { title: 'Sales lead playbook', owners: ['Nizam'], status: 'Not yet started', golive_date: '2026-07-27' },
      { title: 'Sales PPT - CM visual change', owners: ['Manoj'], assigned_by: 'Aswini', status: 'Not yet started', assigned_date: '2026-07-15', golive_date: '2026-07-20' },
      { title: 'Sales decks', owners: ['Samiksha', 'Aswini'], status: 'Not yet started' },
      { title: 'MAOne Sign Up and Tenant creation Process', owners: ['Nizam'], status: 'Not yet started' },
      { title: 'Sales deck - GIFs to be slowed down', owners: ['Manoj'], assigned_by: 'Aswini', status: 'Not yet started', assigned_date: '2026-07-16', start_date: '2026-07-16' },
      { title: 'Blog uploading', owners: ['Jenson'], assigned_by: 'Samiksha', status: 'In progress', assigned_date: '2026-07-15', golive_date: '2026-07-16' }
    ]
  },
  {
    name: 'Managelabels.com project',
    tasks: [
      { title: 'Label management Demo by Vilva', owners: ['Samiksha'], status: 'Not yet started', golive_date: '2026-07-17' },
      { title: 'Page Content', owners: ['Aswini'], status: 'In progress', assigned_date: '2026-07-15', start_date: '2026-07-20', end_date: '2026-07-24', golive_date: '2026-07-24' },
      { title: 'Creatives for the page', owners: ['Namitha'], status: 'Not yet started', golive_date: '2026-07-29' },
      { title: 'Videos for the page', owners: ['Manoj'], status: 'Not yet started', golive_date: '2026-07-29' },
      { title: 'Campaign content', owners: ['Samiksha', 'Aswini'], status: 'Not yet started', golive_date: '2026-07-31' },
      { title: 'Page Creation', owners: ['Jenson'], status: 'Not yet started', golive_date: '2026-08-05' }
    ]
  },
  {
    name: 'Investor Campaign',
    tasks: [
      { title: 'Strategy discussion with Srivatsan Sir', owners: ['Nived'], status: 'Not yet started', golive_date: '2026-07-22' }
    ]
  },
  {
    name: 'US Strategy',
    tasks: [
      { title: 'Campaign strategy', owners: ['Nived'], assigned_by: 'Nived', status: 'Not yet started', golive_date: '2026-07-31' }
    ]
  }
]

export function seed(db) {
  const insertMember = db.prepare('INSERT INTO members (name) VALUES (?)')
  const insertProject = db.prepare('INSERT INTO projects (name, sort_order) VALUES (?, ?)')
  const insertTask = db.prepare(`
    INSERT INTO tasks (project_id, title, owners, assigned_by, status, reviewed, assigned_date, start_date, end_date, golive_date, notes, sort_order)
    VALUES (@project_id, @title, @owners, @assigned_by, @status, @reviewed, @assigned_date, @start_date, @end_date, @golive_date, @notes, @sort_order)
  `)

  db.transaction(() => {
    for (const name of MEMBERS) insertMember.run(name)
    PROJECTS.forEach((project, pIdx) => {
      const { lastInsertRowid: projectId } = insertProject.run(project.name, pIdx)
      project.tasks.forEach((t, tIdx) => {
        insertTask.run({
          project_id: projectId,
          title: t.title,
          owners: JSON.stringify(t.owners || []),
          assigned_by: t.assigned_by || null,
          status: t.status || 'Not yet started',
          reviewed: t.reviewed || 0,
          assigned_date: t.assigned_date || null,
          start_date: t.start_date || null,
          end_date: t.end_date || null,
          golive_date: t.golive_date || null,
          notes: t.notes || null,
          sort_order: tIdx
        })
      })
    })
  })()

  console.log('Database seeded with team roster and current Excel data.')
}
