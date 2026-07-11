import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const MealMonitoring = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form check date (defaults to today)
  const [mealDate, setMealDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Current meal selections for logging
  const [breakfast, setBreakfast] = useState('Pending');
  const [lunch, setLunch] = useState('Pending');
  const [dinner, setDinner] = useState('Pending');

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

  const fetchMealsHistory = async (profileId) => {
    if (!profileId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/meals/elderly/${profileId}`);
      if (res.data.success) {
        setMeals(res.data.data);
        
        // Populate form if today/date matches
        const match = res.data.data.find(m => m.date === mealDate);
        if (match) {
          setBreakfast(match.breakfast);
          setLunch(match.lunch);
          setDinner(match.dinner);
        } else {
          setBreakfast('Pending');
          setLunch('Pending');
          setDinner('Pending');
        }
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
      fetchMealsHistory(selectedProfileId);
    }
  }, [selectedProfileId, mealDate]);

  const handleLogMeals = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('/meals', {
        elderlyId: selectedProfileId,
        date: mealDate,
        breakfast,
        lunch,
        dinner
      });

      if (res.data.success) {
        setSuccess('Meal statuses updated successfully!');
        fetchMealsHistory(selectedProfileId);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to log meal status.');
    }
  };

  // Analyze skipped meals in last 7 days
  const getSkippedCount = () => {
    let count = 0;
    const past7Days = meals.slice(0, 7);
    past7Days.forEach(m => {
      if (m.breakfast === 'Skipped') count++;
      if (m.lunch === 'Skipped') count++;
      if (m.dinner === 'Skipped') count++;
    });
    return count;
  };

  const skippedCount = getSkippedCount();

  if (profiles.length === 0 && !loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="card-custom p-5 bg-white text-center shadow-sm">
          <i className="bi bi-egg-fried text-primary display-1 mb-4"></i>
          <h2 className="fw-bold">No Elderly Profiles Registered</h2>
          <p className="text-muted fs-5 mb-4">You need to create a profile before accessing meal monitoring dashboard details.</p>
          <Link to="/profiles" className="btn btn-primary btn-lg px-4 py-3 shadow">Create Profile</Link>
        </div>
      </div>
    );
  }

  const getMealBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-success';
      case 'Skipped': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid">
      {/* Header & Selector */}
      <div className="row align-items-center mb-4">
        <div className="col-md-7 mb-3 mb-md-0">
          <h1 className="fw-bold mb-1">{t('meals')}</h1>
          <p className="text-muted mb-0">Record breakfast, lunch, and dinner statuses to prevent nutritional risks.</p>
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

      {/* Skipped meals nutritional warning alert */}
      {skippedCount >= 3 && (
        <div className="alert alert-danger d-flex align-items-center gap-3 py-3 mb-4 shadow-sm border-0" role="alert">
          <i className="bi bi-heartbreak-fill fs-2"></i>
          <div>
            <strong className="d-block text-uppercase">Nutritional Risk warning banner</strong>
            <span>This senior has skipped <strong>{skippedCount} meals</strong> in the last week! Persistent skipping can deteriorate vital levels. Please verify their food preparations.</span>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Meal logging checkbox card */}
        <div className="col-lg-5">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-4"><i className="bi bi-calendar-check text-primary me-2"></i>Log Meal Intake</h5>
            <form onSubmit={handleLogMeals}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Target Date</label>
                <input 
                  type="date" 
                  className="form-control form-control-custom"
                  value={mealDate}
                  onChange={(e) => setMealDate(e.target.value)}
                  required
                />
              </div>

              {/* Breakfast */}
              <div className="mb-3">
                <label className="form-label small fw-semibold d-block">Breakfast Status</label>
                <div className="btn-group w-100" role="group">
                  {['Completed', 'Skipped', 'Pending'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`btn btn-sm ${breakfast === opt ? (opt === 'Completed' ? 'btn-success' : opt === 'Skipped' ? 'btn-danger' : 'btn-secondary') : 'btn-outline-secondary'}`}
                      onClick={() => setBreakfast(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lunch */}
              <div className="mb-3">
                <label className="form-label small fw-semibold d-block">Lunch Status</label>
                <div className="btn-group w-100" role="group">
                  {['Completed', 'Skipped', 'Pending'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`btn btn-sm ${lunch === opt ? (opt === 'Completed' ? 'btn-success' : opt === 'Skipped' ? 'btn-danger' : 'btn-secondary') : 'btn-outline-secondary'}`}
                      onClick={() => setLunch(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dinner */}
              <div className="mb-4">
                <label className="form-label small fw-semibold d-block">Dinner Status</label>
                <div className="btn-group w-100" role="group">
                  {['Completed', 'Skipped', 'Pending'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`btn btn-sm ${dinner === opt ? (opt === 'Completed' ? 'btn-success' : opt === 'Skipped' ? 'btn-danger' : 'btn-secondary') : 'btn-outline-secondary'}`}
                      onClick={() => setDinner(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold shadow">
                Save Daily Meal logs
              </button>
            </form>
          </div>
        </div>

        {/* Meal History Table */}
        <div className="col-lg-7">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-clock-history text-secondary me-2"></i>Meal Intake History</h5>
            
            {loading && meals.length === 0 ? (
              [1, 2].map(i => (
                <div className="skeleton mb-3" style={{ height: '70px', borderRadius: '8px' }} key={i}></div>
              ))
            ) : meals.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No meals logged yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Breakfast</th>
                      <th>Lunch</th>
                      <th>Dinner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meals.map((m) => (
                      <tr key={m._id}>
                        <td><strong>{m.date}</strong></td>
                        <td>
                          <span className={`badge ${getMealBadgeClass(m.breakfast)}`}>
                            {m.breakfast}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getMealBadgeClass(m.lunch)}`}>
                            {m.lunch}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getMealBadgeClass(m.dinner)}`}>
                            {m.dinner}
                          </span>
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

export default MealMonitoring;
