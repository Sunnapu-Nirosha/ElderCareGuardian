import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('family');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Required check
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Password length check
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Password match check
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await signup(name, email, phone, password, role);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="card border-0 shadow-lg p-4" style={{ width: '460px', borderRadius: '20px', backgroundColor: 'var(--card-bg)' }}>
        <div className="text-center mb-4">
          <span className="fs-1 d-block mb-2">🛡️</span>
          <h2 className="fw-bold">Create Account</h2>
          <p className="text-muted small">Register as a family member or portal administrator</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 small py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">Family Member Name</label>
            <input
              type="text"
              className="form-control form-control-custom"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control form-control-custom"
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">Phone Number</label>
            <input
              type="tel"
              className="form-control form-control-custom"
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {/* User Role */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">Account Role</label>
            <select
              className="form-select form-control-custom"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="family">Family Member (Manage profile, meds, wellness)</option>
              <option value="admin">System Admin (View global system logs & statistics)</option>
            </select>
          </div>

          <div className="row">
            {/* Password */}
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Password</label>
              <input
                type="password"
                className="form-control form-control-custom"
                placeholder="Min 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Confirm Password</label>
              <input
                type="password"
                className="form-control form-control-custom"
                placeholder="Confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-3 fw-semibold shadow mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : null}
            Register
          </button>
        </form>

        <div className="text-center mt-4 pt-2 border-top">
          <p className="text-muted small mb-0">
            Already have an account? <Link to="/login" className="text-primary fw-semibold text-decoration-none">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
