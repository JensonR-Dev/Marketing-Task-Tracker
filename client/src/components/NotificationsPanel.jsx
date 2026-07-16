import { useEffect, useRef } from 'react'
import { timeAgo } from '../constants.js'

export default function NotificationsPanel({ notifications, onMarkAll, onMarkOne, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [onClose])

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <div className="notif-panel" ref={ref}>
      <div className="notif-header">
        <strong>Notifications</strong>
        {hasUnread && <button className="btn btn-ghost" onClick={onMarkAll}>Mark all read</button>}
      </div>
      <div className="notif-list">
        {notifications.length === 0 && <div className="notif-empty">Nothing yet. When someone assigns you a task or comments on it, it shows up here.</div>}
        {notifications.map(n => (
          <button
            key={n.id}
            className={`notif-item ${n.is_read ? '' : 'notif-unread'}`}
            onClick={() => { if (!n.is_read) onMarkOne(n.id) }}
            title={n.is_read ? '' : 'Click to mark as read'}
          >
            <span className="notif-dot" aria-hidden="true">{n.type === 'comment' ? '💬' : '📌'}</span>
            <span className="notif-body">
              <span className="notif-message">{n.message}</span>
              <span className="notif-time">{timeAgo(n.created_at)}</span>
            </span>
            {!n.is_read && <span className="notif-badge-dot" />}
          </button>
        ))}
      </div>
    </div>
  )
}
