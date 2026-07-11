import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ toggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.slice(0, 5)); // show latest 5
      }
      
      const countRes = await axios.get('/notifications/unread-count');
      if (countRes.data.success) {
        setUnreadCount(countRes.data.count);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center gap-2">
        <button 
          className="btn btn-outline-secondary d-lg-none me-2" 
          onClick={toggleMobileSidebar}
          aria-label="Toggle Navigation"
        >
          <i className="bi bi-list"></i>
        </button>
        <span className="navbar-brand h1 mb-0 fs-4 text-primary d-none d-sm-inline-block fw-bold">
          🛡️ {t('brandName')}
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Language Switcher */}
        <div className="dropdown">
          <button 
            className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <i className="bi bi-translate text-primary"></i>
            <span className="d-none d-md-inline">{lang.toUpperCase()}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end border-0 shadow">
            <li><button className="dropdown-item" onClick={() => setLang('en')}>🇺🇸 English</button></li>
            <li><button className="dropdown-item" onClick={() => setLang('te')}>🇮🇳 తెలుగు (Telugu)</button></li>
            <li><button className="dropdown-item" onClick={() => setLang('hi')}>🇮🇳 हिन्दी (Hindi)</button></li>
            <li><button className="dropdown-item" onClick={() => setLang('es')}>🇪🇸 Español (Spanish)</button></li>
          </ul>
        </div>

        {/* Theme Toggle */}
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          title="Toggle Light/Dark Mode"
        >
          {theme === 'light' ? <i className="bi bi-moon-stars-fill text-dark"></i> : <i className="bi bi-sun-fill text-warning"></i>}
        </button>

        {/* Notifications Dropdown */}
        <div className="dropdown">
          <button 
            className="btn btn-link position-relative p-1 text-decoration-none" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <i className="bi bi-bell-fill fs-5 text-secondary"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg py-2" style={{ width: '320px' }}>
            <li className="dropdown-header border-bottom pb-2 d-flex justify-content-between align-items-center">
              <span className="fw-bold fs-6">{t('notifications')}</span>
              {unreadCount > 0 && <span className="badge bg-danger-subtle text-danger">{unreadCount} new</span>}
            </li>
            {notifications.length === 0 ? (
              <li className="text-center py-4 text-muted">
                <i className="bi bi-bell-slash fs-2 mb-2 d-block text-secondary"></i>
                No notifications
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n._id} className={`dropdown-item py-3 border-bottom ${n.status === 'unread' ? 'bg-light-subtle' : ''}`}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="fw-semibold text-truncate" style={{ maxWidth: '220px' }}>{n.title}</div>
                      <small className="text-muted d-block text-wrap" style={{ fontSize: '0.75rem' }}>{n.message}</small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(n.createdAt).toLocaleTimeString()}</small>
                    </div>
                    {n.status === 'unread' && (
                      <button 
                        className="btn btn-sm btn-link text-primary p-0 text-decoration-none"
                        style={{ fontSize: '0.75rem' }}
                        onClick={(e) => handleMarkAsRead(n._id, e)}
                      >
                        Read
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
            <li className="text-center pt-2">
              <Link to="/notifications" className="text-primary text-decoration-none small fw-semibold">View All Notifications</Link>
            </li>
          </ul>
        </div>

        {/* User Profile Dropdown */}
        <div className="dropdown">
          <button 
            className="btn btn-link dropdown-toggle text-decoration-none p-0 d-flex align-items-center gap-2" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '38px', height: '38px' }}>
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="d-none d-lg-inline text-dark fw-semibold" style={{ color: 'var(--text-color)' }}>
              {user ? user.name : 'User'}
            </span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end border-0 shadow">
            <li className="dropdown-header">
              <span className="fw-bold d-block text-dark" style={{ color: 'var(--text-color)' }}>{user ? user.name : ''}</span>
              <small className="text-muted">{user ? user.email : ''}</small>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li><Link className="dropdown-item" to="/settings"><i className="bi bi-gear me-2"></i>{t('settings')}</Link></li>
            {user?.role === 'admin' && (
              <li><Link className="dropdown-item text-primary" to="/admin"><i className="bi bi-shield-check me-2"></i>{t('admin')}</Link></li>
            )}
            <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>{t('logout')}</button></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
