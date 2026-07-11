import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const NotificationCenter = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
      
      const countRes = await axios.get('/notifications/unread-count');
      if (countRes.data.success) {
        setUnreadCount(countRes.data.count);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const res = await axios.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setSuccess('Notification marked as read.');
        fetchNotifications();
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (err) {
      setError('Failed to update status.');
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const res = await axios.put('/notifications/read-all');
      if (res.data.success) {
        setSuccess('All notifications marked as read.');
        fetchNotifications();
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (err) {
      setError('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/notifications/${id}`);
      if (res.data.success) {
        setSuccess('Notification deleted.');
        fetchNotifications();
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (err) {
      setError('Failed to delete notification.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Emergency Detected': return 'bi-exclamation-triangle-fill text-danger';
      case 'Medicine Missed': return 'bi-capsule-fill text-warning';
      case 'No Response': return 'bi-telephone-x-fill text-danger';
      case 'Mood Concern': return 'bi-emoji-frown-fill text-info';
      case 'Health Concern': return 'bi-clipboard-pulse text-warning';
      default: return 'bi-info-circle-fill text-secondary';
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="fw-bold mb-1">{t('notifications')}</h1>
          <p className="text-muted mb-0">Manage system notifications and critical healthcare alarm alerts.</p>
        </div>
        <div className="d-flex gap-2">
          {unreadCount > 0 && (
            <button className="btn btn-outline-primary" onClick={handleMarkAllRead}>
              <i className="bi bi-check2-all me-1"></i> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="card-custom p-4 bg-white mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h5 className="fw-bold mb-0">Recent Alerts & Critical Warnings</h5>
          <span className="badge bg-danger rounded-pill px-3 py-2">{unreadCount} Unread Logs</span>
        </div>

        {loading && notifications.length === 0 ? (
          [1, 2, 3].map(i => (
            <div className="skeleton mb-3" style={{ height: '70px', borderRadius: '8px' }} key={i}></div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-bell-slash display-4 mb-3 d-block"></i>
            <p>No notifications logs in your folder.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {notifications.map((n) => (
              <div 
                className={`p-3 border rounded-3 d-flex justify-content-between align-items-center transition-all ${n.status === 'unread' ? 'bg-light-subtle shadow-sm' : ''}`} 
                key={n._id}
                style={{ borderLeft: n.status === 'unread' ? '4px solid var(--primary-color) !important' : '' }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div className="fs-3 mt-1">
                    <i className={`bi ${getNotificationIcon(n.type)}`}></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 d-flex flex-wrap align-items-center gap-2">
                      {n.title}
                      <span className="badge bg-secondary-subtle text-secondary small style={{ fontSize: '0.65rem' }}">{n.type}</span>
                    </h6>
                    <p className="mb-0 text-muted small">{n.message}</p>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
                
                <div className="d-flex gap-2">
                  {n.status === 'unread' && (
                    <button 
                      className="btn btn-sm btn-outline-success" 
                      onClick={() => handleMarkRead(n._id)}
                      title="Mark as Read"
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-danger" 
                    onClick={() => handleDelete(n._id)}
                    title="Delete Notification"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
