import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const LandingPage = () => {
  const { t } = useLanguage();

  const features = [
    { icon: "bi-capsule-fill", color: "text-primary", title: "Medication Reminders", desc: "Configure custom dosage timers, schedules, and instructions. Family members checklist compliance logs easily." },
    { icon: "bi-clipboard2-pulse-fill", color: "text-success", title: "Daily Wellness Log", desc: "Monitor daily wellness responses. Real-time NLP checks for health risks and alerts family instantly." },
    { icon: "bi-exclamation-triangle-fill", color: "text-danger", title: "Emergency Care triggers", desc: "Detects fall injuries, sudden chest pain, or missed check-in windows (24h/48h/72h) and triggers alerts." },
    { icon: "bi-emoji-smile-fill", color: "text-warning", title: "Mood Tracking", desc: "Identify anxiety, loneliness, or sadness trends. Track weekly and monthly mental wellness scores." },
    { icon: "bi-egg-fried", color: "text-info", title: "Meal Checkers", desc: "Monitor breakfast, lunch, and dinner logs. Automatically flags warnings on repetitive skipped meals." },
    { icon: "bi-file-earmark-medical-fill", color: "text-primary", title: "Clinical Health Reports", desc: "Compile weekly adherence sheets. Features a single-button Print/PDF download layout for doctors." }
  ];

  const steps = [
    { num: "01", title: "Register Account", desc: "Sign up securely as a family member and configure your profile settings." },
    { num: "02", title: "Add Elderly Profile", desc: "Add medical histories, blood groups, addresses, and emergency phone contacts." },
    { num: "03", title: "Link Senior Device", desc: "Senior speaks check-ins in Telugu, Hindi, Spanish, or English via voice." },
    { num: "04", title: "Audit Wellness Logs", desc: "Receive immediate alarm warnings, review meal histories, and print doctor sheets." }
  ];

  return (
    <div className="hero-grid-bg min-height-100vh pb-5" style={{ color: 'var(--text-main)' }}>
      {/* Floating Transparent Navbar */}
      <nav className="floating-navbar d-flex justify-content-between align-items-center">
        <span className="navbar-brand h1 mb-0 fs-4 fw-bold text-gradient-primary">
          🛡️ {t('brandName')}
        </span>
        <div className="d-flex gap-2">
          <Link to="/login" className="btn btn-outline-primary btn-sm px-4 py-2">Login</Link>
          <Link to="/signup" className="btn btn-primary btn-sm px-4 py-2 shadow-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container" style={{ paddingTop: '140px', minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <div className="row align-items-center g-5">
          {/* Left Text */}
          <div className="col-lg-6">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-3 px-3 py-2 text-uppercase fw-bold" style={{ letterSpacing: '1px', borderRadius: '30px', fontSize: '0.75rem' }}>
              🛡️ AI-POWERED ELDERCARE MONITOR
            </span>
            <h1 className="display-4 fw-extrabold mb-3 lh-1">
              Voice-Based Care Portal for <span className="text-gradient-primary">Elderly Parents</span>
            </h1>
            <p className="lead text-muted mb-4 fs-5" style={{ lineHeight: '1.7' }}>
              Bridging the gap when distance separates you. Designed specifically for senior relatives who live alone, cannot read English, or cannot use smartphones. Log compliance status, track wellness, and receive critical voice alarm warnings.
            </p>
            

            <div className="mb-4"></div>


            <div className="d-flex flex-wrap gap-3">
              <Link to="/signup" className="btn btn-primary btn-lg px-5 py-3 shadow">{t('getStarted')}</Link>
              <a href="#features" className="btn btn-outline-secondary btn-lg px-4 py-3">Explore Features</a>
            </div>
          </div>

          {/* Right Graphic Mockup (Beautiful Elderly Image) */}
          <div className="col-lg-6">
            <div className="card-custom p-0 overflow-hidden border-0 shadow-lg bg-white" style={{ borderRadius: '24px' }}>
              <img 
                src="/happy_seniors.png" 
                alt="Elderly Grandparents Care" 
                className="w-100 d-block" 
                style={{ height: '450px', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Aggregate Statistics showcase */}
      <section className="container py-5 my-3 border-top border-bottom">
        <div className="row text-center g-4">
          <div className="col-md-3">
            <h2 className="fw-bold text-gradient-primary display-6 mb-1">98%</h2>
            <small className="text-muted text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Medicine Adherence</small>
          </div>
          <div className="col-md-3 border-start-md">
            <h2 className="fw-bold text-gradient-primary display-6 mb-1">&lt;2s</h2>
            <small className="text-muted text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Voice Transcription</small>
          </div>
          <div className="col-md-3 border-start-md">
            <h2 className="fw-bold text-gradient-primary display-6 mb-1">4+</h2>
            <small className="text-muted text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Languages Supported</small>
          </div>
          <div className="col-md-3 border-start-md">
            <h2 className="fw-bold text-gradient-primary display-6 mb-1">100%</h2>
            <small className="text-muted text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Critical Alert Delivery</small>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" className="py-5">
        <div className="container">
          <div className="text-center max-width-md mx-auto mb-5">
            <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-1 fw-bold text-uppercase" style={{ borderRadius: '20px', fontSize: '0.7rem' }}>SaaS CAPABILITIES</span>
            <h2 className="display-6 fw-bold mb-2">Designed for remote care management</h2>
            <p className="text-muted">Explore the MERN stack modules tailored for remote monitoring and hackathons.</p>
          </div>
          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-md-6 col-lg-4" key={i}>
                <div className="card-custom h-100 p-4">
                  <div className={`${f.color} fs-1 mb-3`}>
                    <i className={`bi ${f.icon}`}></i>
                  </div>
                  <h4 className="fw-bold mb-2">{f.title}</h4>
                  <p className="text-muted mb-0 small" style={{ lineHeight: '1.6' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stepper Guide */}
      <section className="py-5 bg-white-subtle border-top border-bottom">
        <div className="container">
          <div className="text-center max-width-md mx-auto mb-5">
            <span className="badge bg-success-subtle text-success mb-2 px-3 py-1 fw-bold text-uppercase" style={{ borderRadius: '20px', fontSize: '0.7rem' }}>GETTING STARTED</span>
            <h2 className="display-6 fw-bold mb-2">Setup is simple and takes 2 minutes</h2>
            <p className="text-muted">How AI ElderCare Guardian connects families and elderly relatives.</p>
          </div>
          <div className="row g-4">
            {steps.map((s, i) => (
              <div className="col-md-6 col-lg-3 text-center text-sm-start" key={i}>
                <div className="card-custom p-4 bg-white h-100 border-0 shadow-sm">
                  <div className="fs-1 fw-extrabold text-primary opacity-20 mb-2">{s.num}</div>
                  <h5 className="fw-bold mb-2">{s.title}</h5>
                  <p className="text-muted small mb-0">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-5">
        <div className="container py-4">
          <div className="text-center max-width-md mx-auto mb-5">
            <span className="badge bg-info-subtle text-info mb-2 px-3 py-1 fw-bold text-uppercase" style={{ borderRadius: '20px', fontSize: '0.7rem' }}>REVIEWS</span>
            <h2 className="display-6 fw-bold mb-2">Peace of mind for family members</h2>
            <p className="text-muted">Real stories of families using AI Guardian for remote support.</p>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card-custom p-4 bg-white h-100">
                <p className="text-muted italic" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                  "My father lives alone in Hyderabad. He doesn't know English or use smartphones, but he speaks Telugu. When he fell in the hallway, the voice recognition detected it, translated the transcript, and I got a critical alert in Pune. Truly a life-saving app!"
                </p>
                <div className="d-flex align-items-center gap-2 mt-4">
                  <div className="avatar bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>R</div>
                  <div>
                    <h6 className="mb-0 fw-bold">Rao K.</h6>
                    <small className="text-muted">Hyderabad / Pune</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-custom p-4 bg-white h-100">
                <p className="text-muted italic" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                  "Configuring medication reminders and weekly checkins has put my mind at ease. The dashboard charts are highly visual. I can generate a clinical report and print it for my mom's cardiologist checkups."
                </p>
                <div className="d-flex align-items-center gap-2 mt-4">
                  <div className="avatar bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>P</div>
                  <div>
                    <h6 className="mb-0 fw-bold">Priya S.</h6>
                    <small className="text-muted">Bangalore</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-4 mt-5 text-center text-muted small border-top">
        <p className="mb-1 fw-bold text-dark">&copy; {new Date().getFullYear()} AI ElderCare Guardian. All rights reserved.</p>
        <p className="mb-0 text-muted">Designed for remote care monitoring, wellness check-ins, and emergency intent detection.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
