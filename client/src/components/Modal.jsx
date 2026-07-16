import { useEffect, useState } from 'react'

// Replaces window.prompt/confirm, which some browsers block.
export default function Modal({ modal, onClose }) {
  const [value, setValue] = useState(modal.initialValue || '')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function submit() {
    if (modal.type === 'input') {
      if (!value.trim()) return
      modal.onSubmit(value.trim())
    } else {
      modal.onConfirm()
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h3>{modal.title}</h3>
        {modal.message && <p className="modal-message">{modal.message}</p>}
        {modal.type === 'input' && (
          <input
            className="modal-input"
            autoFocus
            placeholder={modal.placeholder || ''}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
        )}
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${modal.danger ? 'btn-danger-solid' : 'btn-primary'}`}
            onClick={submit}
            disabled={modal.type === 'input' && !value.trim()}
          >
            {modal.confirmLabel || (modal.type === 'input' ? 'Create' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
