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

## Run it for the whole team (office network)

Easiest way: edit the password inside `start-team.ps1` (not committed to git),
then run it — it builds the frontend if needed, prints the address teammates
should open, and starts the server:

```
.\start-team.ps1
```

Manual equivalent:

```
npm run build
$env:TEAM_PASSWORD = "your-password"; npm start
```

The app runs on port 3001. Anyone on the office network opens
`http://<your-machine-IP>:3001` (the script prints this; or find your IP with
`ipconfig`). Run it on a machine that stays on. If teammates can't reach it,
Windows Firewall is likely blocking inbound port 3001 — allowing it needs
admin rights (ask IT to allow inbound TCP 3001 for Node.js).

To use a different port: set the `PORT` environment variable before `npm start`.

## Team password

If the `TEAM_PASSWORD` environment variable is set, every visitor must enter
that shared password once per browser before they can use the app. Without the
variable (e.g. local development), no password is asked.

## Code

The code lives at https://github.com/JensonR-Dev/Marketing-Task-Tracker
(private). The database and the password script are gitignored — only code is
on GitHub, never team data.

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
