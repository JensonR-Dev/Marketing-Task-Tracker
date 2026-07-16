import { useEffect, useRef, useState } from 'react'

export default function OwnerSelect({ owners, members, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function toggle(name) {
    onChange(owners.includes(name) ? owners.filter(o => o !== name) : [...owners, name])
  }

  return (
    <div className="owner-select" ref={ref}>
      <button className="owner-trigger" onClick={() => setOpen(o => !o)}>
        {owners.length === 0
          ? <span className="placeholder">Assign…</span>
          : owners.map(o => <span key={o} className="owner-chip">{o}</span>)}
      </button>
      {open && (
        <div className="owner-popover">
          {members.map(m => (
            <label key={m.id} className="owner-option">
              <input
                type="checkbox"
                checked={owners.includes(m.name)}
                onChange={() => toggle(m.name)}
              />
              {m.name}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
