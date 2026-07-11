import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const AdminPanel = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const analyticRes = await axios.get('/admin/analytics');
      if (analyticRes.data.success) {
        setAnalytics(analyticRes.data.data);
      }

      const usersRes = await axios.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrator analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? All associated profiles, medications, and records will be deleted!')) return;
    try {
      const res = await axios.delete(`/admin/users/${id}`);
      if (res.data.success) {
        setSuccess('User deleted successfully.');
        fetchAdminData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  const systemLogs = [
    { type: 'Info', msg: 'System Database initialized successfully.', time: 'Just now' },
    { type: 'Auth', msg: 'User signup processed: role family member.', time: '5 mins ago' },
    { type: 'Alert', msg: 'Automated voice-transcription alarm triggered: Fall severity High.', time: '12 mins ago' },
    { type: 'Info', msg: 'Weekly clinical reporting aggregations complete.', time: '1 hour ago' },
    { type: 'Server', msg: 'CORS settings validated. API server listening on Port 5000.', time: '2 hours ago' }
  ];

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">{t('admin')}</h1>
          <p className="text-muted mb-0">System administration, platform analytics, and user account management.</p>
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

      {/* Aggregate Metrics cards */}
      {analytics && (
        <div className="row g-4 mb-4">
          <div className="col-sm-6 col-md-3">
            <div className="card-custom p-3 bg-white h-100 text-center">
              <small className="text-muted fw-semibold small text-uppercase">Total Users</small>
              <h2 className="fw-bold text-primary mt-2 mb-0">{analytics.totalUsers}</h2>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="card-custom p-3 bg-white h-100 text-center">
              <small className="text-muted fw-semibold small text-uppercase">Elderly Profiles</small>
              <h2 className="fw-bold text-success mt-2 mb-0">{analytics.totalProfiles}</h2>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="card-custom p-3 bg-white h-100 text-center">
              <small className="text-muted fw-semibold small text-uppercase">Active Alarm Warnings</small>
              <h2 className="fw-bold text-danger mt-2 mb-0">{analytics.activeAlerts}</h2>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="card-custom p-3 bg-white h-100 text-center">
              <small className="text-muted fw-semibold small text-uppercase">Active Family Members</small>
              <h2 className="fw-bold text-info mt-2 mb-0">{analytics.activeUsers}</h2>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* User management list */}
        <div className="col-lg-7">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-people-fill text-primary me-2"></i>Platform User Accounts</h5>
            {loading && users.length === 0 ? (
              [1, 2].map(i => (
                <div className="skeleton mb-3" style={{ height: '70px', borderRadius: '8px' }} key={i}></div>
              ))
            ) : users.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No users found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <strong className="d-block text-dark">{u.name}</strong>
                          <small className="text-muted">{u.phone}</small>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="text-end">
                          <button 
                            className="btn btn-sm btn-light border text-danger" 
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u.role === 'admin'}
                            title={u.role === 'admin' ? "Cannot delete administrative accounts" : "Delete User"}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* System Logs */}
        <div className="col-lg-5">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-activity text-secondary me-2"></i>Live System Logs</h5>
            <div className="d-flex flex-column gap-3 mt-3">
              {systemLogs.map((log, idx) => (
                <div className="p-3 border rounded-3 bg-light" key={idx}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className={`badge bg-${log.type === 'Alert' ? 'danger' : log.type === 'Auth' ? 'warning text-dark' : 'secondary'} small`}>
                      {log.type}
                    </span>
                    <small className="text-muted">{log.time}</small>
                  </div>
                  <small className="text-dark fw-semibold font-monospace d-block">{log.msg}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
