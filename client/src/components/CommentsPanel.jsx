import { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function CommentsPanel({ task, currentUser, onClose, onCommentAdded }) {
  const [comments, setComments] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setComments(null)
    api.getComments(task.id).then(setComments)
  }, [task.id])

  async function submit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const comment = await api.addComment(task.id, currentUser, trimmed)
      setComments(cs => [...(cs || []), comment])
      setText('')
      onCommentAdded(task.id)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-header">
          <div>
            <h3>{task.title}</h3>
            <span className="drawer-sub">Comments</span>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {comments === null && <div className="drawer-empty">Loading…</div>}
          {comments && comments.length === 0 && <div className="drawer-empty">No comments yet. Start the discussion.</div>}
          {comments && comments.map(c => (
            <div key={c.id} className="comment">
              <div className="comment-meta">
                <span className="avatar">{c.author[0]}</span>
                <strong>{c.author}</strong>
                <span className="comment-time">{new Date(c.created_at + 'Z').toLocaleString()}</span>
              </div>
              <p>{c.text}</p>
            </div>
          ))}
        </div>

        <form className="drawer-footer" onSubmit={submit}>
          <input
            value={text}
            placeholder={`Comment as ${currentUser}…`}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
          <button className="btn btn-primary" disabled={!text.trim() || sending}>Send</button>
        </form>
      </aside>
    </>
  )
}
