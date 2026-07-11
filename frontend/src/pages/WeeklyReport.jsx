import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const WeeklyReport = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fetchReport = async (profileId) => {
    if (!profileId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/reports/weekly/${profileId}`);
      if (res.data.success) {
        setReport(res.data.data);
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
      fetchReport(selectedProfileId);
    }
  }, [selectedProfileId]);

  const handlePrint = () => {
    window.print();
  };

  if (profiles.length === 0 && !loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="card-custom p-5 bg-white text-center shadow-sm">
          <i className="bi bi-file-earmark-medical-fill text-primary display-1 mb-4"></i>
          <h2 className="fw-bold">No Elderly Profiles Registered</h2>
          <p className="text-muted fs-5 mb-4">You need to register at least one profile to generate weekly health sheets.</p>
          <Link to="/profiles" className="btn btn-primary btn-lg px-4 py-3 shadow">Create Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Selector and Print button */}
      <div className="row align-items-center mb-4 d-print-none">
        <div className="col-md-6 mb-3 mb-md-0">
          <h1 className="fw-bold mb-1">{t('reports')}</h1>
          <p className="text-muted mb-0">Review compliance reports and print summaries for clinical consultations.</p>
        </div>
        <div className="col-md-6 d-flex flex-wrap gap-2 justify-content-md-end align-items-center">
          <div className="d-flex align-items-center gap-2">
            <label className="fw-semibold text-muted small text-nowrap mb-0">Select Profile:</label>
            <select 
              className="form-select form-control-custom shadow-sm bg-white"
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              {profiles.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.relationship})</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary shadow-sm px-4" onClick={handlePrint}>
            <i className="bi bi-printer-fill me-1"></i> Print / PDF Export
          </button>
        </div>
      </div>

      {loading && !report ? (
        <div className="card-custom p-5 bg-white text-center shadow-sm">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Compiling Report Sheet...</span>
          </div>
          <p className="text-muted mt-3 mb-0">Assembling logs and computing statistics...</p>
        </div>
      ) : report ? (
        /* Printable Report Sheet Layout */
        <div className="card-custom p-5 bg-white shadow-sm mb-4 border rounded-3" id="printable-report-sheet">
          {/* Clinical Header */}
          <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
            <div>
              <span className="fs-3 fw-bold text-primary">🛡️ AI ElderCare Guardian</span>
              <h5 className="text-secondary fw-semibold mt-1">Weekly Patient Health Summary</h5>
              <small className="text-muted">Report generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</small>
            </div>
            <div className="text-end">
              <span className="badge bg-secondary-subtle text-secondary px-3 py-2 text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Clinical Report Sheet</span>
            </div>
          </div>

          {/* Patient Metadata Grid */}
          <div className="row g-4 mb-5 p-3 bg-light rounded-3">
            <div className="col-md-4">
              <small className="text-muted d-block uppercase small">Patient Name:</small>
              <h5 className="fw-bold mb-0 text-dark">{report.profile.name}</h5>
            </div>
            <div className="col-md-2">
              <small className="text-muted d-block uppercase small">Age:</small>
              <h5 className="fw-bold mb-0 text-dark">{report.profile.age} yrs</h5>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block uppercase small">Blood Group:</small>
              <h5 className="fw-bold mb-0 text-dark">{report.profile.bloodGroup || 'Not Specified'}</h5>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block uppercase small">Language Preferred:</small>
              <h5 className="fw-bold mb-0 text-dark">{report.profile.preferredLanguage}</h5>
            </div>
            <div className="col-12 mt-3 pt-2 border-top">
              <small className="text-muted d-block uppercase small">Current Medical Diagnosis:</small>
              <span className="text-dark fw-semibold">{report.profile.medicalConditions || 'No chronic conditions reported.'}</span>
            </div>
          </div>

          {/* Aggregated statistics table */}
          <h5 className="fw-bold border-bottom pb-2 mb-3"><i className="bi bi-bar-chart-fill text-primary me-2"></i>Weekly Performance Statistics</h5>
          <div className="row g-4 mb-5">
            {/* Medicine Compliance */}
            <div className="col-md-4">
              <div className="p-3 border rounded-3 text-center h-100 bg-white shadow-sm">
                <h4 className={`fw-bold display-6 ${report.medication.compliancePercentage >= 80 ? 'text-success' : 'text-warning'}`}>{report.medication.compliancePercentage}%</h4>
                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Medicine Adherence</small>
                <div className="text-muted mt-2 small">{report.medication.takenCount} / {report.medication.totalSchedulesLogged} doses logged</div>
              </div>
            </div>

            {/* Mood tracking score */}
            <div className="col-md-4">
              <div className="p-3 border rounded-3 text-center h-100 bg-white shadow-sm">
                <h4 className="fw-bold display-6 text-info">{report.mood.averageScore} <span className="fs-6 text-muted">/ 5.0</span></h4>
                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Average Mood Score</small>
                <div className="text-muted mt-2 small">Emotional stability index</div>
              </div>
            </div>

            {/* Nutrition rate */}
            <div className="col-md-4">
              <div className="p-3 border rounded-3 text-center h-100 bg-white shadow-sm">
                <h4 className={`fw-bold display-6 ${report.meals.skippedCount >= 3 ? 'text-danger' : 'text-success'}`}>
                  {report.meals.completedCount} <span className="fs-6 text-muted">meals</span>
                </h4>
                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Nutritional Intake</small>
                <div className="text-muted mt-2 small">{report.meals.skippedCount} meals skipped warning</div>
              </div>
            </div>
          </div>

          {/* Detail log sheets */}
          <div className="row g-4 mb-4">
            {/* Recent Emergency events */}
            <div className="col-md-6">
              <h6 className="fw-bold mb-3 border-bottom pb-2"><i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>Recent Emergencies ({report.emergency.totalCount} incidents)</h6>
              {report.emergency.recentAlerts.length === 0 ? (
                <p className="text-muted small">No emergency incidents flagged this week.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-custom align-middle">
                    <thead>
                      <tr>
                        <th>Alert Type</th>
                        <th>Severity</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.emergency.recentAlerts.map(a => (
                        <tr key={a._id}>
                          <td><strong>{a.alertType}</strong><br /><small className="text-muted">{a.description}</small></td>
                          <td><span className={`badge bg-${a.severity === 'Critical' || a.severity === 'High' ? 'danger' : 'info'} text-white`}>{a.severity}</span></td>
                          <td><small className="text-muted">{new Date(a.createdAt).toLocaleDateString()}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mood distribution list */}
            <div className="col-md-6">
              <h6 className="fw-bold mb-3 border-bottom pb-2"><i className="bi bi-emoji-smile-fill text-info me-2"></i>Weekly Mood Log Distribution</h6>
              <div className="d-flex flex-column gap-2 mt-2">
                {Object.keys(report.mood.moodDistribution).map(mood => (
                  <div className="d-flex justify-content-between align-items-center" key={mood}>
                    <span className="small text-muted">{mood}:</span>
                    <div className="progress flex-grow-1 mx-3" style={{ height: '8px' }}>
                      <div className="progress-bar bg-info" style={{ width: `${report.mood.recentLogs.length > 0 ? (report.mood.moodDistribution[mood] / report.mood.recentLogs.length) * 100 : 0}%` }}></div>
                    </div>
                    <span className="small text-dark fw-bold">{report.mood.moodDistribution[mood]} days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-top pt-4 mt-5 text-center text-muted small d-none d-print-block">
            AI ElderCare Guardian - Voice Care Portal Sheets &bull; Confirmed Clinical Log Copy
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WeeklyReport;
