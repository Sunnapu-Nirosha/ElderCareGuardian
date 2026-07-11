import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ isMobileActive, closeMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    closeMobileSidebar();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', labelKey: 'dashboard', icon: 'bi-grid-1x2-fill' },
    { to: '/profiles', labelKey: 'profiles', icon: 'bi-people-fill' },
    { to: '/medicines', labelKey: 'medicines', icon: 'bi-capsule' },
    { to: '/wellness', labelKey: 'wellness', icon: 'bi-clipboard2-pulse-fill' },
    { to: '/voice', labelKey: 'voice', icon: 'bi-mic-fill' },
    { to: '/emergency', labelKey: 'emergency', icon: 'bi-exclamation-triangle-fill' },
    { to: '/meals', labelKey: 'meals', icon: 'bi-egg-fried' },
    { to: '/notifications', labelKey: 'notifications', icon: 'bi-bell-fill' },
    { to: '/reports', labelKey: 'reports', icon: 'bi-file-earmark-medical-fill' },
    { to: '/settings', labelKey: 'settings', icon: 'bi-gear-fill' },
  ];

  return (
    <div className={`sidebar ${isMobileActive ? 'active' : ''}`}>
      {/* Brand Header */}
      <div className="p-4 border-bottom border-secondary d-flex flex-column align-items-center">
        <span className="fs-3 fw-bold text-white mb-1">🛡️ Guardian</span>
        <span className="badge bg-primary-subtle text-primary text-uppercase px-3 py-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
          {user?.role === 'admin' ? 'Admin Portal' : 'Family Member'}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow-1 py-3 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            onClick={closeMobileSidebar}
          >
            <i className={`bi ${link.icon}`}></i>
            <span>{t(link.labelKey)}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            onClick={closeMobileSidebar}
            style={{ color: '#20c997' }}
          >
            <i className="bi bi-shield-check"></i>
            <span>{t('admin')}</span>
          </NavLink>
        )}
      </div>

      {/* Bottom User Area */}
      <div className="p-3 border-top border-secondary bg-dark-subtle">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px' }}>
            {user ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-truncate">
            <small className="text-white d-block fw-semibold">{user ? user.name : 'User'}</small>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{user ? user.email : ''}</small>
          </div>
        </div>
        <button className="btn btn-sm btn-outline-danger w-100 py-2" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2"></i>{t('logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
