import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { useProfile } from '../state/ProfileContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { profile } = useProfile()
  const nav = useNavigate()

  const showAdmin = !!user && (!!profile?.isAdmin || profile?.accountType === 'admin')

  async function onLogout() {
    await logout()
    nav('/dashboard')
  }

  const notificationsCount = 0
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!notifOpen) return
      if (!notifRef.current) return
      if (notifRef.current.contains(e.target)) return
      setNotifOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [notifOpen])

  return (
    <div className="nav">
      <div className="nav-inner">
        <div className="brand">
          <div className="badge" />
          <div>
            <h1>Body Recomposition Tracker</h1>
            <div className="small">Created by Andre Gomes</div>
          </div>
        </div>

        <div className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
          {user && <NavLink to="/entry" className={({ isActive }) => isActive ? 'active' : ''}>Entry</NavLink>}
          {user && <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>Profile</NavLink>}
          {showAdmin && <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>Admin</NavLink>}
        </div>

        <div className="nav-actions">
          {!user ? (
            <>
              <NavLink to="/login" className="btn">Log in</NavLink>
              <NavLink to="/signup" className="btn primary">Sign up</NavLink>
            </>
          ) : (
            <>
              <div className="popover-wrap" ref={notifRef}>
                <button
                  className="icon-btn"
                  aria-label="Notifications"
                  title="Notifications"
                  onClick={() => setNotifOpen(v => !v)}
                >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 22a2.25 2.25 0 0 0 2.2-1.75H9.8A2.25 2.25 0 0 0 12 22Z" fill="currentColor" opacity="0.85"/>
                  <path d="M19 17H5c1.2-1.3 2-2.4 2-6a5 5 0 0 1 10 0c0 3.6.8 4.7 2 6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M10 6a2 2 0 0 1 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                {notificationsCount > 0 && <span className="notif-badge">{notificationsCount}</span>}
              </button>
                {notifOpen && (
                  <div className="popover">
                    <div className="popover-title">Notifications</div>
                    <div className="small">This is a placeholder for a future notification system.</div>
                    <div style={{ height: 10 }} />
                    <div className="panel" style={{ margin: 0 }}>
                      <div className="small">No notifications yet.</div>
                    </div>
                  </div>
                )}
              </div>
              <button className="btn danger" onClick={onLogout}>Log out</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
