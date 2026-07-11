import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profiles on load
  const fetchProfiles = async () => {
    try {
      const res = await axios.get('/profiles');
      if (res.data.success && res.data.data.length > 0) {
        setProfiles(res.data.data);
        // Default to first profile
        setSelectedProfileId(res.data.data[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchDashboardReport = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/reports/weekly/${id}`);
      if (res.data.success) {
        setReportData(res.data.data);
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
      fetchDashboardReport(selectedProfileId);
    }
  }, [selectedProfileId]);

  const handleProfileChange = (e) => {
    setSelectedProfileId(e.target.value);
  };

  if (profiles.length === 0 && !loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="card-custom p-5 bg-white text-center shadow-sm">
          <i className="bi bi-people-fill text-primary display-1 mb-4"></i>
          <h2 className="fw-bold">Welcome to AI ElderCare Guardian</h2>
          <p className="text-muted max-width-md mx-auto fs-5 mb-4">
            You haven't registered any elderly profiles yet. Add a profile for your parent or relative to start monitoring their medicine, wellness checks, meals, and voice alerts.
          </p>
          <Link to="/profiles" className="btn btn-primary btn-lg px-4 py-3 shadow">
            <i className="bi bi-plus-lg me-2"></i> {t('addProfile')}
          </Link>
        </div>
      </div>
    );
  }

  // Determine health state styles
  const getHealthStatusBadge = (hours) => {
    if (hours === 999) return { text: 'No Logs Yet', color: 'secondary' };
    if (hours >= 72) return { text: 'Critical Attention', color: 'danger' };
    if (hours >= 48) return { text: 'Needs Contact Check', color: 'warning' };
    if (hours >= 24) return { text: 'Warning: 24h Missed', color: 'warning' };
    return { text: 'Connected & Good', color: 'success' };
  };

  const statusBadge = reportData ? getHealthStatusBadge(reportData.contactStatus.hoursSinceLastCheckin) : { text: 'Loading', color: 'secondary' };

  return (
    <div className="container-fluid">
      {/* Welcome Banner */}
      <div className="row align-items-center mb-4">
        <div className="col-md-7 mb-3 mb-md-0">
          <h1 className="fw-bold mb-1">{t('dashboard')}</h1>
          <p className="text-muted mb-0">Monitor wellness checks, meals compliance, and voice interaction alerts.</p>
        </div>
        <div className="col-md-5 d-flex justify-content-md-end">
          <div className="d-flex align-items-center gap-2">
            <label className="fw-semibold text-muted small text-nowrap mb-0">Select Profile:</label>
            <select 
              className="form-select form-control-custom shadow-sm bg-white"
              value={selectedProfileId}
              onChange={handleProfileChange}
              style={{ minWidth: '200px' }}
            >
              {profiles.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.relationship})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && !reportData ? (
        <div className="row g-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="col-md-4" key={i}>
              <div className="card-custom p-4 bg-white" style={{ height: '140px' }}>
                <div className="skeleton mb-2" style={{ height: '24px', width: '60%' }}></div>
                <div className="skeleton mb-2" style={{ height: '36px', width: '40%' }}></div>
                <div className="skeleton" style={{ height: '16px', width: '80%' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : reportData ? (
        <>
          {/* Missed Contact Danger Banner */}
          {reportData.contactStatus.hoursSinceLastCheckin >= 24 && (
            <div className={`alert alert-${reportData.contactStatus.hoursSinceLastCheckin >= 72 ? 'danger' : 'warning'} d-flex align-items-center gap-3 py-3 mb-4 shadow-sm border-0`} role="alert">
              <i className="bi bi-exclamation-octagon-fill fs-2"></i>
              <div>
                <strong className="d-block text-uppercase">Missed Contact Check Alert</strong>
                <span>{reportData.profile.name} has not responded to wellness checks for the last {reportData.contactStatus.hoursSinceLastCheckin} hours! Last check-in was registered on {reportData.contactStatus.lastCheckinTime ? new Date(reportData.contactStatus.lastCheckinTime).toLocaleString() : 'Never'}.</span>
              </div>
            </div>
          )}

          {/* Metric Cards */}
          <div className="row g-4 mb-4">
            {/* Total Elderly Profiles */}
            <div className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card-custom p-3 bg-white h-100 d-flex flex-column justify-content-between">
                <div>
                  <small className="text-muted fw-semibold uppercase text-truncate d-block">{t('totalProfiles')}</small>
                  <h2 className="fw-bold mt-2 mb-0 text-primary">{profiles.length}</h2>
                </div>
                <span className="text-muted small mt-2 d-block">Registered profiles</span>
              </div>
            </div>

            {/* Medicine Compliance */}
            <div className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card-custom p-3 bg-white h-100 d-flex flex-column justify-content-between">
                <div>
                  <small className="text-muted fw-semibold uppercase text-truncate d-block">{t('medicineCompliance')}</small>
                  <h2 className={`fw-bold mt-2 mb-0 ${reportData.medication.compliancePercentage >= 80 ? 'text-success' : 'text-warning'}`}>
                    {reportData.medication.compliancePercentage}%
                  </h2>
                </div>
                <div className="progress mt-2" style={{ height: '6px' }}>
                  <div className={`progress-bar bg-${reportData.medication.compliancePercentage >= 80 ? 'success' : 'warning'}`} style={{ width: `${reportData.medication.compliancePercentage}%` }}></div>
                </div>
              </div>
            </div>

            {/* Health Status */}
            <div className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card-custom p-3 bg-white h-100 d-flex flex-column justify-content-between">
                <div>
                  <small className="text-muted fw-semibold uppercase text-truncate d-block">{t('healthStatus')}</small>
                  <span className={`badge bg-${statusBadge.color} mt-2 d-inline-block px-2 py-1`}>
                    {statusBadge.text}
                  </span>
                </div>
                <span className="text-muted small mt-2 d-block">Missed window status</span>
              </div>
            </div>

            {/* Emergency Alerts */}
            <div className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card-custom p-3 bg-white h-100 d-flex flex-column justify-content-between">
                <div>
                  <small className="text-muted fw-semibold uppercase text-truncate d-block">{t('emergencyAlerts')}</small>
                  <h2 className={`fw-bold mt-2 mb-0 ${reportData.emergency.totalCount > 0 ? 'text-danger' : 'text-success'}`}>
                    {reportData.emergency.totalCount}
                  </h2>
                </div>
                <span className="text-muted small mt-2 d-block">Incidents flagged</span>
              </div>
            </div>

            {/* Mood Score */}
            <div className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card-custom p-3 bg-white h-100 d-flex flex-column justify-content-between">
                <div>
                  <small className="text-muted fw-semibold uppercase text-truncate d-block">{t('moodScore')}</small>
                  <h2 className="fw-bold mt-2 mb-0 text-info">{reportData.mood.averageScore} <span className="fs-6 text-muted">/ 5.0</span></h2>
                </div>
                <span className="text-muted small mt-2 d-block">Average 7-day mood</span>
              </div>
            </div>

            {/* Last Check-in Time */}
            <div className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card-custom p-3 bg-white h-100 d-flex flex-column justify-content-between">
                <div>
                  <small className="text-muted fw-semibold uppercase text-truncate d-block">{t('lastCheckin')}</small>
                  <h6 className="fw-bold mt-2 mb-0 text-dark">
                    {reportData.contactStatus.hoursSinceLastCheckin === 999 
                      ? 'No logs recorded' 
                      : `${reportData.contactStatus.hoursSinceLastCheckin} hours ago`}
                  </h6>
                </div>
                <span className="text-muted small mt-2 d-block">Wellness check-in status</span>
              </div>
            </div>
          </div>

          {/* Graphics & Analytical Charts (SVG-Based Custom Graphics) */}
          <div className="row g-4 mb-4">
            {/* Medicine Compliance bar chart */}
            <div className="col-lg-6">
              <div className="card-custom p-4 bg-white h-100">
                <h5 className="fw-bold mb-3"><i className="bi bi-capsule text-primary me-2"></i>Weekly Medication Compliance</h5>
                <div className="d-flex flex-column gap-3 justify-content-center pt-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted" style={{ width: '80px' }}>Taken:</span>
                    <div className="progress flex-grow-1" style={{ height: '24px' }}>
                      <div className="progress-bar bg-success" style={{ width: `${reportData.medication.compliancePercentage}%` }}>
                        {reportData.medication.takenCount} doses
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted" style={{ width: '80px' }}>Missed:</span>
                    <div className="progress flex-grow-1" style={{ height: '24px' }}>
                      <div className="progress-bar bg-danger" style={{ width: `${100 - reportData.medication.compliancePercentage}%` }}>
                        {reportData.medication.totalSchedulesLogged - reportData.medication.takenCount} doses
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-3 text-muted small">
                    Compliance status evaluates all logs recorded. High adherence is critical.
                  </div>
                </div>
              </div>
            </div>

            {/* Mood trends graph (SVG Line Visualizer) */}
            <div className="col-lg-6">
              <div className="card-custom p-4 bg-white h-100">
                <h5 className="fw-bold mb-3"><i className="bi bi-emoji-smile text-info me-2"></i>Mood Trends (Average: {reportData.mood.averageScore})</h5>
                <div className="text-center py-2">
                  <svg viewBox="0 0 400 120" className="w-100" style={{ height: '100px' }}>
                    {/* Grid Lines */}
                    <line x1="10" y1="10" x2="390" y2="10" stroke="var(--border-color)" strokeWidth="0.5" />
                    <line x1="10" y1="60" x2="390" y2="60" stroke="var(--border-color)" strokeWidth="0.5" />
                    <line x1="10" y1="110" x2="390" y2="110" stroke="var(--border-color)" strokeWidth="0.5" />

                    {/* Chart Line */}
                    <path
                      d="M 20 90 Q 70 20 120 70 T 220 30 T 320 80 T 380 40"
                      fill="none"
                      stroke="var(--secondary-color)"
                      strokeWidth="3"
                    />

                    {/* Indicators */}
                    <circle cx="120" cy="70" r="4" fill="var(--primary-color)" />
                    <circle cx="220" cy="30" r="4" fill="var(--primary-color)" />
                    <circle cx="320" cy="80" r="4" fill="var(--primary-color)" />
                  </svg>
                  <div className="d-flex justify-content-between px-3 mt-2 text-muted small">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Meal Tracking checklist statistics */}
            <div className="col-md-6">
              <div className="card-custom p-4 bg-white h-100">
                <h5 className="fw-bold mb-3"><i className="bi bi-egg-fried text-warning me-2"></i>Meal Compliance Summary</h5>
                <div className="row align-items-center g-3">
                  <div className="col-sm-5 text-center">
                    <div className="fs-1 fw-bold text-success">{reportData.meals.completedCount}</div>
                    <small className="text-muted">Completed Meals</small>
                  </div>
                  <div className="col-sm-7 border-start ps-4">
                    <div className="mb-2">
                      <small className="d-block text-muted">Completed</small>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-success" style={{ width: `${reportData.meals.completedCount > 0 ? (reportData.meals.completedCount / (reportData.meals.completedCount + reportData.meals.skippedCount + reportData.meals.pendingCount)) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <small className="d-block text-muted">Skipped</small>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-danger" style={{ width: `${reportData.meals.skippedCount > 0 ? (reportData.meals.skippedCount / (reportData.meals.completedCount + reportData.meals.skippedCount + reportData.meals.pendingCount)) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <small className="d-block text-muted">Pending</small>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-secondary" style={{ width: `${reportData.meals.pendingCount > 0 ? (reportData.meals.pendingCount / (reportData.meals.completedCount + reportData.meals.skippedCount + reportData.meals.pendingCount)) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency frequency alert lists */}
            <div className="col-md-6">
              <div className="card-custom p-4 bg-white h-100">
                <h5 className="fw-bold mb-3"><i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>Emergency Alerts Severity</h5>
                <div className="d-flex justify-content-between text-center pt-2">
                  <div className="px-2">
                    <div className="fs-3 fw-bold text-success">{reportData.emergency.severityDistribution.Low}</div>
                    <span className="badge bg-success-subtle text-success small">Low</span>
                  </div>
                  <div className="px-2 border-start">
                    <div className="fs-3 fw-bold text-info">{reportData.emergency.severityDistribution.Medium}</div>
                    <span className="badge bg-info-subtle text-info small">Medium</span>
                  </div>
                  <div className="px-2 border-start">
                    <div className="fs-3 fw-bold text-warning">{reportData.emergency.severityDistribution.High}</div>
                    <span className="badge bg-warning-subtle text-warning small">High</span>
                  </div>
                  <div className="px-2 border-start">
                    <div className="fs-3 fw-bold text-danger">{reportData.emergency.severityDistribution.Critical}</div>
                    <span className="badge bg-danger-subtle text-danger small">Critical</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Dashboard;
