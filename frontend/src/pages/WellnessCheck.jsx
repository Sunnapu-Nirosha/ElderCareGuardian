import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const WellnessCheck = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [response, setResponse] = useState('I am doing fine and took a morning walk.');
  const [healthStatus, setHealthStatus] = useState('Normal');
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchProfiles = async () => {
    try {
      const res = await axios.get('/profiles');
      if (res.data.success && res.data.data.length > 0) {
        setProfiles(res.data.data);
        setSelectedProfileId(res.data.data[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchWellnessData = async (profileId) => {
    if (!profileId) return;
    setLoading(true);
    try {
      const histRes = await axios.get(`/wellness/elderly/${profileId}`);
      if (histRes.data.success) {
        setHistory(histRes.data.data);
      }

      const statRes = await axios.get(`/wellness/elderly/${profileId}/statistics`);
      if (statRes.data.success) {
        setStats(statRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfileId) {
      fetchWellnessData(selectedProfileId);
    }
  }, [selectedProfileId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProfileId || !date || !response || !healthStatus) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const res = await axios.post('/wellness', {
        elderlyId: selectedProfileId,
        date,
        response,
        healthStatus,
        remarks
      });

      if (res.data.success) {
        setSuccess('Wellness check-in logged successfully!');
        setRemarks('');
        fetchWellnessData(selectedProfileId);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to log wellness check-in.');
    }
  };

  if (profiles.length === 0 && !loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="card-custom p-5 bg-white text-center shadow-sm">
          <i className="bi bi-clipboard2-pulse-fill text-primary display-1 mb-4"></i>
          <h2 className="fw-bold">No Elderly Profiles Registered</h2>
          <p className="text-muted fs-5 mb-4">You need to create at least one elderly profile before logging wellness checks.</p>
          <Link to="/profiles" className="btn btn-primary btn-lg px-4 py-3 shadow">Create Profile</Link>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Good': return 'bg-success';
      case 'Normal': return 'bg-info';
      case 'Not Feeling Well': return 'bg-warning text-dark';
      case 'Needs Help': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid">
      {/* Welcome & Selector */}
      <div className="row align-items-center mb-4">
        <div className="col-md-7 mb-3 mb-md-0">
          <h1 className="fw-bold mb-1">{t('wellness')}</h1>
          <p className="text-muted mb-0">Record daily check-in logs and monitor health trend history timelines.</p>
        </div>
        <div className="col-md-5 d-flex justify-content-md-end">
          <div className="d-flex align-items-center gap-2">
            <label className="fw-semibold text-muted small text-nowrap mb-0">Select Profile:</label>
            <select 
              className="form-select form-control-custom shadow-sm bg-white"
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              {profiles.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.relationship})</option>
              ))}
            </select>
          </div>
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

      {/* Wellness Stats percentages widgets */}
      {stats && stats.total > 0 && (
        <div className="row g-4 mb-4">
          {Object.keys(stats.percentages).map((status) => (
            <div className="col-sm-6 col-lg-3" key={status}>
              <div className="card-custom p-3 bg-white h-100 d-flex align-items-center justify-content-between">
                <div>
                  <small className="text-muted fw-semibold small text-uppercase">{status} status</small>
                  <h3 className="fw-bold mb-0 mt-1">{stats.percentages[status]}%</h3>
                </div>
                <span className={`badge ${getStatusBadgeClass(status)} px-2 py-1`}>
                  {stats.statusCounts[status]} logs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row g-4">
        {/* Wellness Daily submission form */}
        <div className="col-lg-5">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-pencil-square text-primary me-2"></i>Log Check-in Check</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Check-in Date *</label>
                <input
                  type="date"
                  className="form-control form-control-custom"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Daily Response *</label>
                <textarea
                  className="form-control form-control-custom"
                  rows="3"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="e.g. Spoke to mom, she said she took a morning walk but was feeling a bit tired."
                  required
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Health Status *</label>
                <select
                  className="form-select form-control-custom"
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value)}
                >
                  <option value="Good">Good (Feeling great, active)</option>
                  <option value="Normal">Normal (No major complaints)</option>
                  <option value="Not Feeling Well">Not Feeling Well (Needs monitoring)</option>
                  <option value="Needs Help">Needs Help (Urgent contact needed)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Remarks / Doctor Instructions</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Schedule checkup on Monday"
                />
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
                Submit Response Log
              </button>
            </form>
          </div>
        </div>

        {/* Timeline views and historical table logs */}
        <div className="col-lg-7">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-4"><i className="bi bi-clock-history text-secondary me-2"></i>{t('wellnessTimeline')}</h5>

            {loading && history.length === 0 ? (
              [1, 2].map(i => (
                <div className="skeleton mb-3" style={{ height: '70px', borderRadius: '8px' }} key={i}></div>
              ))
            ) : history.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No wellness check-ins logged yet.</p>
            ) : (
              <div className="position-relative ps-4 border-start border-2 ms-2">
                {history.map((log, index) => (
                  <div className="mb-4 position-relative" key={log._id}>
                    {/* Circle timeline dot */}
                    <div 
                      className={`position-absolute rounded-circle ${getStatusBadgeClass(log.healthStatus)}`} 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        left: '-27px', 
                        top: '5px', 
                        border: '2px solid white' 
                      }}
                    ></div>
                    
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-secondary-subtle text-secondary small">{log.date}</span>
                      <span className={`badge ${getStatusBadgeClass(log.healthStatus)}`}>
                        {log.healthStatus}
                      </span>
                    </div>
                    <p className="mb-1 text-dark fw-semibold" style={{ fontSize: '0.92rem' }}>{log.response}</p>
                    {log.remarks && <small className="text-muted d-block italic">Remarks: {log.remarks}</small>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessCheck;
