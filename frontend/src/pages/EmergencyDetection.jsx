import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const EmergencyDetection = () => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  
  // Manual simulation fields
  const [alertType, setAlertType] = useState('Fall');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('Elderly reported a fall in the hallway.');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchProfiles = async () => {
    try {
      const res = await axios.get('/profiles');
      if (res.data.success && res.data.data.length > 0) {
        setProfiles(res.data.data);
        setSelectedProfileId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/emergency/alerts');
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchAlerts();
  }, []);

  const handleTriggerManualAlert = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProfileId) {
      setError('Please select an elderly profile first.');
      return;
    }

    try {
      const res = await axios.post('/emergency/alert', {
        elderlyId: selectedProfileId,
        alertType,
        severity,
        description
      });

      if (res.data.success) {
        setSuccess('Manual Emergency Alert generated successfully!');
        fetchAlerts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to trigger emergency alert.');
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      const res = await axios.put(`/emergency/alert/${id}/resolve`);
      if (res.data.success) {
        setSuccess('Alert status updated to Resolved.');
        fetchAlerts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to resolve alert.');
    }
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'Critical': return 'bg-danger text-white';
      case 'High': return 'bg-warning text-dark';
      case 'Medium': return 'bg-info text-white';
      default: return 'bg-secondary text-white';
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">{t('emergency')}</h1>
          <p className="text-muted mb-0">Review active notifications and configure manual alarm triggers.</p>
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

      {/* Warning Banners for Active Alarms */}
      {alerts.filter(a => a.status === 'Active').map((a) => (
        <div className={`alert alert-${a.severity === 'Critical' || a.severity === 'High' ? 'danger' : 'warning'} d-flex justify-content-between align-items-center mb-4 shadow-sm border-0 py-3`} key={a._id} role="alert">
          <div className="d-flex align-items-center gap-3">
            <i className="bi bi-exclamation-octagon-fill fs-2"></i>
            <div>
              <strong className="d-block text-uppercase">{a.alertType} Alert ({a.severity} Severity)</strong>
              <span>
                For: <strong>{a.elderlyId?.name || 'Elderly'}</strong> &bull; {a.description}
              </span>
              <small className="text-muted d-block mt-1">Logged on: {new Date(a.createdAt).toLocaleString()}</small>
            </div>
          </div>
          <button className="btn btn-sm btn-light border shadow-sm px-3" onClick={() => handleResolveAlert(a._id)}>
            Resolve Alert
          </button>
        </div>
      ))}

      <div className="row g-4">
        {/* Simulate alarm form */}
        <div className="col-lg-5">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-broadcast text-danger me-2"></i>Manual Alert Simulation</h5>
            <form onSubmit={handleTriggerManualAlert}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Target Elderly Profile</label>
                <select 
                  className="form-select form-control-custom"
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Profile --</option>
                  {profiles.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.relationship})</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Alarm Category</label>
                <select 
                  className="form-select form-control-custom"
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                >
                  <option value="Fall">Fall (Slipped/Tripped)</option>
                  <option value="Chest Pain">Chest Pain (Cardiac Flag)</option>
                  <option value="Breathing Problem">Breathing Problem (Respiratory)</option>
                  <option value="Dizziness">Dizziness (Headache/Spinning)</option>
                  <option value="Fever">Fever (High Temperature)</option>
                  <option value="Emergency">General Emergency Trigger</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Severity Rating</label>
                <select 
                  className="form-select form-control-custom"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="Low">Low (Needs monitoring)</option>
                  <option value="Medium">Medium (Checking required)</option>
                  <option value="High">High (Immediate check-in)</option>
                  <option value="Critical">Critical (Call emergency services)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Alarm Logs / Description</label>
                <textarea 
                  className="form-control form-control-custom"
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Slipped in shower and needs lifting assistance."
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-danger w-100 py-2 fw-semibold shadow">
                Trigger Emergency Alarm
              </button>
            </form>
          </div>
        </div>

        {/* Alarm Logs history table */}
        <div className="col-lg-7">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-clock-history text-secondary me-2"></i>Emergency Incidents Log</h5>
            
            {loading && alerts.length === 0 ? (
              [1, 2].map(i => (
                <div className="skeleton mb-3" style={{ height: '70px', borderRadius: '8px' }} key={i}></div>
              ))
            ) : alerts.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No alerts registered.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom table-hover">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Incident Type</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a) => (
                      <tr key={a._id}>
                        <td><strong>{a.elderlyId?.name || 'Deleted Profile'}</strong></td>
                        <td>
                          <span className="text-dark d-block fw-semibold">{a.alertType}</span>
                          <small className="text-muted d-block text-wrap" style={{ maxWidth: '200px' }}>{a.description}</small>
                        </td>
                        <td>
                          <span className={`badge ${getSeverityBadgeClass(a.severity)}`}>
                            {a.severity}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${a.status === 'Active' ? 'bg-danger' : 'bg-success-subtle text-success'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted d-block">{new Date(a.createdAt).toLocaleDateString()}</small>
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{new Date(a.createdAt).toLocaleTimeString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDetection;
