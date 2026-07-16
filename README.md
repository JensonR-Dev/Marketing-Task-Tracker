# Marketing Team Tracker

Internal task-tracking tool for the marketing team — replaces the Excel sheet.
React frontend + Node.js (Express) API + SQLite database. All data is stored in
`data/tracker.db`, so nothing is lost on refresh or restart.

## Run it (development, on your own machine)

```
cd team-tracker
npm install        # first time only
npm run dev
```

Open http://localhost:5173

## Run it for the whole team (production)

Build once, then run the single server — it serves both the app and the API on one port:

```
npm run build
npm start
```

The app is now on port 3001. Anyone on the same office network can open it at
`http://<your-machine-IP>:3001` (find your IP with `ipconfig`). For a permanent
setup, run these two commands on a machine that stays on (or any small VPS),
optionally with a process manager like `pm2` so it restarts automatically.

To use a different port: set the `PORT` environment variable before `npm start`.

## How it works

- **Sign-in**: first visit shows a name picker (the 8 team members). The choice
  is remembered per browser. Click your name chip in the top-right to switch
  profile at any time. Nived is marked as Manager.
- **Dashboard (default view)**: centralized overview — filter chips
  (project / teammate / status), date-field + date-range filter, search,
  stat cards, status overview bar, workload by teammate, tasks by project,
  and the full task list.
- **Projects view**: "+ New Project" opens a dialog; double-click a project
  name to rename; Delete asks for confirmation. "+ Add task" inside a project;
  everything is edited inline (title, owners, assigned by, status, reviewed,
  dates, notes) and saves automatically.
- **Notifications**: when someone assigns you a task (or comments on one of
  yours), a notification appears under the 🔔 bell within ~15 seconds, and the
  task row is highlighted until you mark it read.
- **Comments**: click 💬 on any task to open the discussion drawer.
- **Overdue**: tasks past their expected go-live date (and not Completed) are
  flagged in red.
- **Theme**: dark by default; the ☀️/🌙 button toggles light mode (remembered
  per browser).
- **Multi-user freshness**: the app re-fetches data every 30 seconds, so
  teammates' changes appear without refreshing.

## Backup

The entire database is the single file `data/tracker.db`. Copy that file
anywhere (e.g. OneDrive) to back it up; restore by copying it back.

## Resetting

Deleting `data/tracker.db` and restarting the server re-creates it with the
original seed data (the state of the Excel sheet as of 16-Jul-2026).
