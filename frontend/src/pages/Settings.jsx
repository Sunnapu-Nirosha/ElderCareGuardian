import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
  const { user, updateDetails, updatePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  // Detail fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [detailSuccess, setDetailSuccess] = useState('');
  const [detailError, setDetailError] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setDetailError('');
    setDetailSuccess('');

    if (!name || !email || !phone) {
      setDetailError('Please fill in all details.');
      return;
    }

    const result = await updateDetails(name, email, phone);
    if (result.success) {
      setDetailSuccess('Profile updated successfully.');
      setTimeout(() => setDetailSuccess(''), 3000);
    } else {
      setDetailError(result.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    const result = await updatePassword(currentPassword, newPassword);
    if (result.success) {
      setPwSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 3000);
    } else {
      setPwError(result.message);
    }
  };

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <h1 className="fw-bold mb-1">{t('settings')}</h1>
        <p className="text-muted mb-0">Manage profile data, password security configurations, and theme attributes.</p>
      </div>

      <div className="row g-4">
        {/* Profile details edit form */}
        <div className="col-lg-6">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-4 border-bottom pb-2"><i className="bi bi-person-fill text-primary me-2"></i>Profile Settings</h5>
            
            {detailSuccess && <div className="alert alert-success py-2 small">{detailSuccess}</div>}
            {detailError && <div className="alert alert-danger py-2 small">{detailError}</div>}

            <form onSubmit={handleUpdateDetails}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Family Member Name</label>
                <input 
                  type="text" 
                  className="form-control form-control-custom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Email Address</label>
                <input 
                  type="email" 
                  className="form-control form-control-custom"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control form-control-custom"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2">
                Save Profile Details
              </button>
            </form>
          </div>
        </div>

        {/* Change password form */}
        <div className="col-lg-6">
          <div className="card-custom p-4 bg-white mb-4">
            <h5 className="fw-bold mb-4 border-bottom pb-2"><i className="bi bi-shield-lock-fill text-secondary me-2"></i>Change Password</h5>
            
            {pwSuccess && <div className="alert alert-success py-2 small">{pwSuccess}</div>}
            {pwError && <div className="alert alert-danger py-2 small">{pwError}</div>}

            <form onSubmit={handleUpdatePassword}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Current Password</label>
                <input 
                  type="password" 
                  className="form-control form-control-custom"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">New Password (Min 8 characters)</label>
                <input 
                  type="password" 
                  className="form-control form-control-custom"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control form-control-custom"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-outline-primary w-100 py-2">
                Change Account Password
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Theme and lang selectors */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card-custom p-4 bg-white">
            <h5 className="fw-bold mb-3"><i className="bi bi-translate text-primary me-2"></i>Preferred Dashboard Language</h5>
            <p className="text-muted small">Change languages for system screens, alerts, and navigation.</p>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button className={`btn btn-sm px-3 ${lang === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setLang('en')}>English</button>
              <button className={`btn btn-sm px-3 ${lang === 'te' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setLang('te')}>తెలుగు (Telugu)</button>
              <button className={`btn btn-sm px-3 ${lang === 'hi' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setLang('hi')}>हिन्दी (Hindi)</button>
              <button className={`btn btn-sm px-3 ${lang === 'es' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setLang('es')}>Español (Spanish)</button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card-custom p-4 bg-white">
            <h5 className="fw-bold mb-3"><i className="bi bi-moon-stars-fill text-secondary me-2"></i>Color Theme Configuration</h5>
            <p className="text-muted small">Select color configurations optimized for low light conditions.</p>
            <div className="mt-3">
              <button className="btn btn-outline-secondary" onClick={toggleTheme}>
                <i className="bi bi-circle-half me-2"></i> Toggle Theme ({theme === 'light' ? 'Light' : 'Dark'})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
