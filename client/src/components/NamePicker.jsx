export default function NamePicker({ members, onPick }) {
  return (
    <div className="center-screen">
      <div className="name-picker">
        <h1>Marketing Team Tracker</h1>
        <p>Who are you? Your name is used for comments and task assignments.</p>
        <div className="name-grid">
          {members.map(m => (
            <button key={m.id} className="name-btn" onClick={() => onPick(m.name)}>
              <span className="avatar">{m.name[0]}</span>
              {m.name}
              {m.role === 'manager' && <span className="role-badge">Manager</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
