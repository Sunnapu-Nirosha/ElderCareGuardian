import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const MedicineManagement = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Medication Compliance Calendar States
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-indexed (Jan=0, Dec=11)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null); // { dateStr, logs: [...] }

  // Calculates compliance level for a calendar day
  const getDayCompliance = (dateStr) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr > todayStr) return 'future';

    const activeMeds = medicines.filter(m => m.status === 'Active');
    if (activeMeds.length === 0) return 'gray';

    let loggedCount = 0;
    let takenCount = 0;
    let missedCount = 0;

    activeMeds.forEach(med => {
      const hist = med.history?.find(h => h.date === dateStr);
      if (hist) {
        loggedCount++;
        if (hist.status === 'taken') takenCount++;
        if (hist.status === 'missed') missedCount++;
      }
    });

    if (loggedCount === 0) return 'gray';
    if (missedCount > 0) return 'red';
    if (takenCount === activeMeds.length) return 'green';
    return 'red'; // Partial compliance counts as missed
  };

  // Generate array representing current month's calendar days
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    
    // Previous month padding
    const firstDayIndex = date.getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dStr);
    }

    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  const handleDayClick = (dateStr) => {
    if (!dateStr) return;
    const activeMeds = medicines.filter(m => m.status === 'Active');
    const logs = activeMeds.map(med => {
      const hist = med.history?.find(h => h.date === dateStr);
      return {
        medicineName: med.medicineName,
        time: med.time,
        dosage: med.dosage,
        status: hist ? hist.status : 'Pending'
      };
    });

    setSelectedCalendarDate({
      dateStr,
      logs
    });
  };

  const formatCalendarDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Form Fields
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('08:00 AM');
  const [frequency, setFrequency] = useState('Daily');
  const [instructions, setInstructions] = useState('Take with water');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Date for compliance marking (defaults to today)
  const [complianceDate, setComplianceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // ==========================================
  // Medication Voice Alarm Simulator States & Functions
  // ==========================================
  const [simStep, setSimStep] = useState(0); // 0: Idle, 1: Time Reached, 2: Voice Alert playing, 3: Confirmed (Voice), 4: Missed (Fail-Safe), 5: Caregiver Notified
  const [simLog, setSimLog] = useState([]);
  const [selectedMedForSim, setSelectedMedForSim] = useState(null);
  const [phoneRinging, setPhoneRinging] = useState(false);
  const [micPulse, setMicPulse] = useState(false);
  const [simAlertNotification, setSimAlertNotification] = useState(null);
  const [simRunning, setSimRunning] = useState(false);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Update simulation medicine when medicines list updates
  useEffect(() => {
    if (medicines.length > 0) {
      const telmisartan = medicines.find(m => m.medicineName.toLowerCase().includes('telmi'));
      const activeMeds = medicines.filter(m => m.status === 'Active');
      setSelectedMedForSim(telmisartan || activeMeds[0] || medicines[0]);
    } else {
      setSelectedMedForSim(null);
    }
  }, [medicines]);

  const logSim = (message) => {
    const timeStr = new Date().toLocaleTimeString();
    setSimLog(prev => [...prev, `[${timeStr}] ${message}`]);
  };

  const playSoundChime = (type = 'chime') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'ring') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn("AudioContext error:", e);
    }
  };

  const speakVoice = (text, lang = 'te-IN') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      const matchVoice = voices.find(v => v.lang.includes('TE') || v.lang.includes('te') || v.lang.toLowerCase().includes('telugu'));
      if (matchVoice) {
        utterance.voice = matchVoice;
      } else {
        const indVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('in'));
        if (indVoice) utterance.voice = indVoice;
      }
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis is not supported in this browser.");
    }
  };

  const handleAutoConfigureSim = async () => {
    setError('');
    setSuccess('');
    try {
      logSim("Initiating Auto-Configuration for Ram Rao & Telmisartan...");
      
      let ramRao = profiles.find(p => p.name === 'Ram Rao');
      let ramRaoId;
      
      if (!ramRao) {
        logSim("Profile 'Ram Rao' not found. Creating a new Elderly Profile...");
        const profileRes = await axios.post('/profiles', {
          name: "Ram Rao",
          relationship: "Father",
          age: 75,
          phone: "+91 98765 43210",
          emergencyContact: {
            name: "Ramesh",
            phone: "+91 99999 88888",
            relationship: "Son"
          }
        });
        
        if (profileRes.data.success) {
          ramRao = profileRes.data.data;
          ramRaoId = ramRao._id;
          logSim(`Created profile 'Ram Rao' (ID: ${ramRaoId}).`);
        } else {
          throw new Error("Failed to create profile 'Ram Rao'");
        }
      } else {
        ramRaoId = ramRao._id;
        logSim(`Profile 'Ram Rao' found (ID: ${ramRaoId}).`);
      }

      const resProfiles = await axios.get('/profiles');
      if (resProfiles.data.success) {
        setProfiles(resProfiles.data.data);
      }
      
      setSelectedProfileId(ramRaoId);
      
      const medsRes = await axios.get(`/medicines/elderly/${ramRaoId}`);
      let medicinesList = medsRes.data.success ? medsRes.data.data : [];
      let telmisartan = medicinesList.find(m => m.medicineName === 'Telmisartan');
      
      if (!telmisartan) {
        logSim("Medication 'Telmisartan' not scheduled for Ram Rao. Adding schedule...");
        const medRes = await axios.post('/medicines', {
          elderlyId: ramRaoId,
          medicineName: "Telmisartan",
          dosage: "40mg",
          time: "08:00 AM",
          frequency: "Daily",
          instructions: "Take daily in the morning with warm water",
          status: "Active"
        });
        
        if (medRes.data.success) {
          telmisartan = medRes.data.data;
          logSim("Medication 'Telmisartan' (40mg, Daily, 08:00 AM) scheduled successfully.");
        } else {
          throw new Error("Failed to create medication schedule");
        }
      } else {
        logSim("Medication 'Telmisartan' (08:00 AM) already exists.");
      }

      setSelectedMedForSim(telmisartan);
      fetchMedicinesAndReport(ramRaoId);
      setSuccess("Successfully auto-configured Ram Rao & Telmisartan!");
      setTimeout(() => setSuccess(''), 3000);
      logSim("Auto-Configuration Complete! Ready to run simulation.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Auto-configuration failed.");
      logSim(`[ERROR] Auto-configuration failed: ${err.message}`);
    }
  };

  const startSimulation = () => {
    const activeProfile = profiles.find(p => p._id === selectedProfileId);
    if (!activeProfile) {
      setError("Please register or select an elderly profile first.");
      return;
    }

    const activeMeds = medicines.filter(m => m.status === 'Active');
    let med = selectedMedForSim;
    
    if (!med) {
      if (activeMeds.length > 0) {
        med = activeMeds[0];
        setSelectedMedForSim(med);
      } else {
        setError("Please add at least one active medication timer (e.g. Telmisartan) or click the Auto-Configure button.");
        return;
      }
    }

    setSimRunning(true);
    setSimStep(1);
    setSimLog([]);
    setPhoneRinging(false);
    setMicPulse(false);
    setSimAlertNotification(null);
    
    logSim(`Step 1/4: Clock hits scheduled time (${med.time}).`);
    logSim(`Server matches schedule: ${activeProfile.name} needs to take ${med.medicineName} (${med.dosage}).`);
    logSim(`System prepares voice event dispatch...`);
    
    playSoundChime('chime');
    
    setTimeout(() => {
      triggerStep2(activeProfile, med);
    }, 2500);
  };

  const triggerStep2 = (profile, med) => {
    setSimStep(2);
    setPhoneRinging(true);
    logSim(`Step 2/4: Elderly phone rings. Broadcasts Voice Notification Alert.`);
    
    const teluguText = `${profile.name} గారు, మీ మందులు వేసుకునే సమయం అయింది. దయచేసి ${med.medicineName} టాబ్లెట్ తీసుకోండి.`;
    const translationText = `Mr. ${profile.name}, it is time for your medicine. Please take your ${med.medicineName} tablet.`;
    
    logSim(`Voice Audio Output (Telugu): "${teluguText}"`);
    logSim(`Translation context: "${translationText}"`);
    
    playSoundChime('ring');
    setTimeout(() => {
      speakVoice(teluguText, 'te-IN');
    }, 600);
  };

  const handleSpeechConfirmation = async () => {
    if (simStep !== 2) return;
    setMicPulse(true);
    setPhoneRinging(false);
    logSim(`Step 3/4: Ram Rao taps pulsing microphone button and speaks confirmation.`);
    logSim(`Speech recognized: "వేసుకున్నాను" (Telugu for "I have taken it").`);
    logSim(`Uploading voice confirmation payload to backend /api/voice/simulate...`);
    
    try {
      const activeProfile = profiles.find(p => p._id === selectedProfileId);
      const res = await axios.post('/voice/simulate', {
        elderlyId: selectedProfileId,
        rawText: "వేసుకున్నాను",
        language: "Telugu"
      });
      
      if (res.data.success) {
        playSoundChime('success');
        logSim(`Backend received voice confirmation. Intent detected: "Medicine Confirmation".`);
        logSim(`Backend database updated: Checked off compliance for today.`);
        
        fetchMedicinesAndReport(selectedProfileId);
        setSimStep(3);
        setMicPulse(false);
        logSim(`SUCCESS: Medicine compliance status updated to 'taken' (100% compliant). Simulation successfully completed!`);
      }
    } catch (err) {
      console.error(err);
      logSim(`[ERROR] Failed to post voice response: ${err.message}`);
      setMicPulse(false);
    }
  };

  const handleSimulateMissedDose = async () => {
    if (simStep !== 2) return;
    setPhoneRinging(false);
    setMicPulse(false);
    logSim(`Step 4/4: Triggering Safety Fail-Safe (Simulation of 30 Minutes expiring).`);
    logSim(`No voice confirmation received within 30 minutes.`);
    logSim(`System flags dose status as 'missed'. Writing record to compliance log...`);
    
    try {
      const activeProfile = profiles.find(p => p._id === selectedProfileId);
      const today = new Date().toISOString().split('T')[0];
      
      const res = await axios.post(`/medicines/${selectedMedForSim._id}/compliance`, {
        date: today,
        status: 'missed'
      });
      
      if (res.data.success) {
        playSoundChime('alert');
        logSim(`Backend registered status as 'missed' for date ${today}.`);
        logSim(`Backend triggered dispatch to Caregiver (${activeProfile.emergencyContact?.name || 'Ramesh'}).`);
        logSim(`Notification inserted into Caregiver Alert Feed.`);
        
        fetchMedicinesAndReport(selectedProfileId);
        setSimStep(4);
        
        const notifRes = await axios.get('/notifications');
        if (notifRes.data.success && notifRes.data.data.length > 0) {
          const missedNotif = notifRes.data.data.find(n => n.type === 'Medicine Missed') || notifRes.data.data[0];
          setSimAlertNotification(missedNotif);
        } else {
          setSimAlertNotification({
            title: 'Medication Missed',
            message: `Medicine Missed: ${activeProfile.name} did not confirm taking his ${selectedMedForSim.time} ${selectedMedForSim.medicineName} tablet.`,
            createdAt: new Date().toISOString()
          });
        }
        logSim(`Caregiver Ramesh's phone receives push alert: "Medicine Missed: ${activeProfile.name} did not confirm taking his ${selectedMedForSim.time} ${selectedMedForSim.medicineName} tablet."`);
      }
    } catch (err) {
      console.error(err);
      logSim(`[ERROR] Failed to mark dose missed: ${err.message}`);
    }
  };

  const simulateCaregiverCall = () => {
    if (simStep !== 4) return;
    playSoundChime('chime');
    logSim(`Caregiver Ramesh taps 'Call Father' on push alert screen.`);
    logSim(`Outgoing call placed to ${profiles.find(p => p._id === selectedProfileId)?.name || 'Father'}'s phone...`);
    
    const callText = `Hey Dad, I saw you missed your BP tablet. Please take it now.`;
    logSim(`Ramesh speaks over voice call: "${callText}"`);
    speakVoice(callText, 'en-US');
    
    setSimStep(5);
    logSim(`Elder receives call and confirms. Compliance fail-safe loop complete and verified.`);
  };

  const resetSimulator = () => {
    setSimStep(0);
    setSimRunning(false);
    setSimLog([]);
    setPhoneRinging(false);
    setMicPulse(false);
    setSimAlertNotification(null);
  };

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

  const fetchMedicinesAndReport = async (profileId) => {
    if (!profileId) return;
    setLoading(true);
    try {
      const medRes = await axios.get(`/medicines/elderly/${profileId}`);
      if (medRes.data.success) {
        setMedicines(medRes.data.data);
      }

      const repRes = await axios.get(`/medicines/elderly/${profileId}/compliance-report`);
      if (repRes.data.success) {
        setReport(repRes.data.data);
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
      fetchMedicinesAndReport(selectedProfileId);
    }
  }, [selectedProfileId]);

  const resetForm = () => {
    setMedicineName('');
    setDosage('');
    setTime('08:00 AM');
    setFrequency('Daily');
    setInstructions('Take with water');
    setStatus('Active');
    setEditId(null);
    setError('');
  };

  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditClick = (med) => {
    setEditId(med._id);
    setMedicineName(med.medicineName);
    setDosage(med.dosage);
    setTime(med.time);
    setFrequency(med.frequency);
    setInstructions(med.instructions);
    setStatus(med.status);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine schedule?')) return;
    try {
      const res = await axios.delete(`/medicines/${id}`);
      if (res.data.success) {
        setSuccess('Medicine deleted successfully.');
        fetchMedicinesAndReport(selectedProfileId);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete medicine.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!medicineName || !dosage || !time) {
      setError('Please fill in Name, Dosage, and Scheduled Time.');
      return;
    }

    const payload = {
      elderlyId: selectedProfileId,
      medicineName,
      dosage,
      time,
      frequency,
      instructions,
      status
    };

    try {
      let res;
      if (editId) {
        res = await axios.put(`/medicines/${editId}`, payload);
      } else {
        res = await axios.post('/medicines', payload);
      }

      if (res.data.success) {
        setSuccess(editId ? 'Medicine updated successfully!' : 'Medicine added successfully!');
        resetForm();
        setShowForm(false);
        fetchMedicinesAndReport(selectedProfileId);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to submit medicine schedule.');
    }
  };

  const handleComplianceToggle = async (medId, val) => {
    try {
      const res = await axios.post(`/medicines/${medId}/compliance`, {
        date: complianceDate,
        status: val // 'taken' or 'missed'
      });
      if (res.data.success) {
        fetchMedicinesAndReport(selectedProfileId);
        setSuccess(`Log registered: Marked as ${val}.`);
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (err) {
      setError('Failed to log compliance.');
    }
  };

  const getComplianceStatusForDate = (med, date) => {
    const log = med.history?.find(h => h.date === date);
    return log ? log.status : 'pending';
  };

  if (profiles.length === 0 && !loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="card-custom p-5 bg-white text-center shadow-sm">
          <i className="bi bi-capsule text-primary display-1 mb-4"></i>
          <h2 className="fw-bold">No Elderly Profiles Registered</h2>
          <p className="text-muted fs-5 mb-4">You need to create at least one elderly profile before adding medications.</p>
          <Link to="/profiles" className="btn btn-primary btn-lg px-4 py-3 shadow">Create Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Welcome & Selector */}
      <div className="row align-items-center mb-4">
        <div className="col-md-7 mb-3 mb-md-0">
          <h1 className="fw-bold mb-1">{t('medicines')}</h1>
          <p className="text-muted mb-0">Add timers, instructions, and audit medication intake compliance rates.</p>
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

      {/* Compliance Statistics Report Widget */}
      {report && (
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card-custom p-4 bg-white text-center">
              <h2 className={`fw-bold display-5 ${report.overallRate >= 80 ? 'text-success' : 'text-warning'}`}>{report.overallRate}%</h2>
              <span className="text-muted fw-semibold small text-uppercase">Overall Compliance Adherence</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card-custom p-4 bg-white text-center">
              <h2 className="fw-bold display-5 text-primary">{report.takenLogs}</h2>
              <span className="text-muted fw-semibold small text-uppercase">Doses Taken Successfully</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card-custom p-4 bg-white text-center">
              <h2 className={`fw-bold display-5 ${report.missedLogs > 0 ? 'text-danger' : 'text-muted'}`}>{report.missedLogs}</h2>
              <span className="text-muted fw-semibold small text-uppercase">Doses Missed Alerts</span>
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        <div className="card-custom p-4 bg-white mb-4">
          <h3 className="fw-bold border-bottom pb-3 mb-4">{editId ? 'Edit Medicine Schedule' : 'Add Medication Schedule'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Medicine Name *</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Paracetamol"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-semibold">Dosage *</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 1 tablet (500mg)"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-semibold">Scheduled Time *</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 08:00 AM, 09:00 PM"
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-semibold">Frequency</label>
                <select
                  className="form-select form-control-custom"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label small fw-semibold">Status</label>
                <select
                  className="form-select form-control-custom"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold">Instructions</label>
              <input
                type="text"
                className="form-control form-control-custom"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Take after breakfast, with warm water"
              />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4 py-2">
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="row g-4">
          {/* Today's Compliance checklist logging */}
          <div className="col-lg-5">
            <div className="card-custom p-4 bg-white mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0"><i className="bi bi-calendar-check text-primary me-2"></i>Daily Compliance Log</h5>
                <input 
                  type="date" 
                  className="form-control form-control-custom py-1 px-2 border" 
                  style={{ width: '150px', fontSize: '0.85rem' }}
                  value={complianceDate}
                  onChange={(e) => setComplianceDate(e.target.value)}
                />
              </div>

              {medicines.filter(m => m.status === 'Active').length === 0 ? (
                <p className="text-muted text-center py-4 mb-0">No active medicines scheduled.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {medicines.filter(m => m.status === 'Active').map(med => {
                    const compStatus = getComplianceStatusForDate(med, complianceDate);
                    return (
                      <div className="p-3 border rounded-3 d-flex justify-content-between align-items-center" key={med._id}>
                        <div>
                          <h6 className="mb-1 fw-bold">{med.medicineName}</h6>
                          <div className="d-flex gap-2 align-items-center">
                            <span className="badge bg-secondary-subtle text-secondary small">{med.time}</span>
                            <span className="small text-muted">{med.dosage}</span>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            className={`btn btn-sm ${compStatus === 'taken' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => handleComplianceToggle(med._id, 'taken')}
                          >
                            <i className="bi bi-check-lg me-1"></i> Taken
                          </button>
                          <button 
                            className={`btn btn-sm ${compStatus === 'missed' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => handleComplianceToggle(med._id, 'missed')}
                          >
                            <i className="bi bi-x-lg me-1"></i> Missed
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visual Medication Compliance Calendar */}
            <div className="card-custom p-4 bg-white mb-4 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-calendar3 text-primary me-2"></i> Compliance Calendar
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-sm btn-light border py-1 px-2" onClick={handlePrevMonth} style={{ borderRadius: '6px' }}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <span className="fw-bold small text-dark" style={{ minWidth: '100px', textAlign: 'center' }}>
                    {monthNames[calendarMonth]} {calendarYear}
                  </span>
                  <button className="btn btn-sm btn-light border py-1 px-2" onClick={handleNextMonth} style={{ borderRadius: '6px' }}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>

              {/* Week Headers */}
              <div className="mb-2 text-center" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <span key={idx} className="text-muted small fw-bold" style={{ fontSize: '0.72rem' }}>{day}</span>
                ))}
              </div>

              {/* Day Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '6px', columnGap: '4px' }}>
                {getDaysInMonth(calendarYear, calendarMonth).map((dayStr, idx) => {
                  if (!dayStr) {
                    return <div key={`empty-${idx}`} style={{ height: '34px' }}></div>;
                  }

                  const dayNum = parseInt(dayStr.split('-')[2]);
                  const complianceStatus = getDayCompliance(dayStr);
                  
                  let dotColor = 'transparent';
                  
                  if (complianceStatus === 'green') dotColor = '#198754';
                  else if (complianceStatus === 'red') dotColor = '#dc3545';
                  else if (complianceStatus === 'gray') dotColor = '#adb5bd';

                  const isToday = dayStr === new Date().toISOString().split('T')[0];

                  return (
                    <div 
                      key={dayStr}
                      className="d-flex flex-column align-items-center justify-content-center position-relative rounded-circle"
                      onClick={() => handleDayClick(dayStr)}
                      style={{ 
                        height: '34px', 
                        cursor: 'pointer', 
                        backgroundColor: isToday ? 'rgba(13, 110, 253, 0.1)' : 'transparent',
                        border: isToday ? '1px solid rgba(13, 110, 253, 0.3)' : 'none',
                        transition: 'background-color 0.2s',
                        fontWeight: isToday ? 'bold' : 'normal'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isToday ? 'rgba(13, 110, 253, 0.1)' : 'transparent'}
                    >
                      <span className="small" style={{ fontSize: '0.8rem', color: '#212529' }}>{dayNum}</span>
                      {complianceStatus !== 'future' && (
                        <span 
                          className="position-absolute bottom-0 rounded-circle" 
                          style={{ 
                            width: '4px', 
                            height: '4px', 
                            backgroundColor: dotColor,
                            marginBottom: '2px'
                          }}
                        ></span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="d-flex justify-content-center gap-3 mt-3 pt-2 border-top small text-muted" style={{ fontSize: '0.7rem' }}>
                <span className="d-flex align-items-center gap-1">
                  <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#198754', display: 'inline-block' }}></span> 100% Taken
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#dc3545', display: 'inline-block' }}></span> Missed Dose
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#adb5bd', display: 'inline-block' }}></span> No Logs
                </span>
              </div>
            </div>
          </div>

          {/* Medicines Schedules & Detail history logs */}
          <div className="col-lg-7">
            <div className="card-custom p-4 bg-white mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0"><i className="bi bi-clock-history text-secondary me-2"></i>Medication Schedules</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={handleAddClick}>
                  <i className="bi bi-plus-lg me-1"></i> Add Timers
                </button>
              </div>

              {loading && medicines.length === 0 ? (
                [1, 2].map(i => (
                  <div className="skeleton mb-3" style={{ height: '70px', borderRadius: '8px' }} key={i}></div>
                ))
              ) : medicines.length === 0 ? (
                <p className="text-muted text-center py-4 mb-0">No medication timers registered yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-custom table-hover">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Schedule</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((med) => (
                        <tr key={med._id}>
                          <td>
                            <strong className="d-block text-dark">{med.medicineName}</strong>
                            <small className="text-muted d-block">{med.dosage} &bull; {med.instructions}</small>
                          </td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary">{med.time}</span>
                            <small className="text-muted d-block mt-1">{med.frequency}</small>
                          </td>
                          <td>
                            <span className={`badge ${med.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                              {med.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              <button className="btn btn-sm btn-light border text-secondary" onClick={() => handleEditClick(med)}>
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDelete(med._id)}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
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
      )}

      {/* 4-Step Voice Alarm System Simulator Section */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card-custom p-4 bg-white border border-info shadow-lg position-relative overflow-hidden mb-5">
            {/* Background design accents */}
            <div className="position-absolute top-0 end-0 p-3 opacity-10">
              <i className="bi bi-cpu-fill display-1 text-primary"></i>
            </div>
            
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-2">
              <div>
                <span className="badge bg-info text-dark mb-2 fw-bold px-3 py-2 text-uppercase">
                  <i className="bi bi-play-circle-fill me-1"></i> Interactive Simulator Sandbox
                </span>
                <h3 className="fw-bold mb-1">Medication Reminder Voice Alarm & Safety Fail-Safe</h3>
                <p className="text-muted mb-0">Test the automated 4-step voice alerts, elder voice confirmation, and caregiver safety notification workflow.</p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-info btn-sm fw-semibold" onClick={handleAutoConfigureSim}>
                  <i className="bi bi-lightning-charge-fill me-1 text-warning"></i> Auto-Configure Demo (Ram Rao & Telmisartan)
                </button>
                {simRunning && (
                  <button className="btn btn-outline-secondary btn-sm" onClick={resetSimulator}>
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Sandbox
                  </button>
                )}
              </div>
            </div>

            {/* Config & Initialization Controls */}
            {!simRunning ? (
              <div className="bg-light p-4 rounded-4 text-center border-dashed">
                <i className="bi bi-clock-history text-info display-4 mb-3 d-block"></i>
                <h5 className="fw-bold mb-2">Ready to Start Medication Reminder Simulation</h5>
                <p className="text-muted mx-auto mb-4" style={{ maxWidth: '600px' }}>
                  This sandbox simulates when the clock hits a scheduled dose time (e.g. 08:00 AM) for an elder. It plays the Telugu Voice Alert via text-to-speech, allows voice confirmation simulation, and triggers the caregiver push notifications if forgotten.
                </p>
                <div className="d-flex justify-content-center gap-3 align-items-center flex-wrap mb-4">
                  <div className="text-start">
                    <label className="small fw-bold text-muted d-block mb-1">Target Profile:</label>
                    <select
                      className="form-select form-control-custom bg-white"
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                    >
                      {profiles.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.relationship})</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-start">
                    <label className="small fw-bold text-muted d-block mb-1">Target Medicine:</label>
                    <select
                      className="form-select form-control-custom bg-white"
                      value={selectedMedForSim ? selectedMedForSim._id : ''}
                      onChange={(e) => {
                        const m = medicines.find(med => med._id === e.target.value);
                        if (m) setSelectedMedForSim(m);
                      }}
                      disabled={medicines.length === 0}
                    >
                      {medicines.length === 0 ? (
                        <option>No medicines scheduled</option>
                      ) : (
                        medicines.map(m => (
                          <option key={m._id} value={m._id}>{m.medicineName} ({m.dosage} @ {m.time})</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-lg px-5 py-3 shadow fw-bold"
                  onClick={startSimulation}
                  disabled={profiles.length === 0 || medicines.length === 0}
                >
                  <i className="bi bi-play-fill me-2 fs-5"></i> Start 08:00 AM Alarm Simulation
                </button>
                {profiles.length === 0 && (
                  <p className="text-danger small mt-2 mb-0">
                    * No elderly profiles registered. Click the 'Auto-Configure Demo' button at the top right to instantly populate sample data.
                  </p>
                )}
              </div>
            ) : (
              <div className="row g-4">
                {/* Column 1: Step Visual Progress & Controls */}
                <div className="col-lg-4">
                  <div className="d-flex flex-column gap-3">
                    <h5 className="fw-bold mb-2 text-info"><i className="bi bi-shuffle me-2"></i>Simulation Flow</h5>

                    {/* Step 1 Card */}
                    <div className={`p-3 rounded-4 border transition-all ${simStep >= 1 ? 'border-success bg-success-subtle bg-opacity-10' : 'border-light bg-light'} d-flex gap-3 align-items-start`}>
                      <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${simStep >= 1 ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary'}`} style={{ width: '36px', height: '36px' }}>
                        {simStep > 1 ? <i className="bi bi-check-lg fw-bold"></i> : '1'}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1">Step 1: Scheduled Time Reached</h6>
                        <p className="small text-muted mb-0">Clock hits 08:00 AM. Server detects medication timer and triggers response check.</p>
                        {simStep === 1 && (
                          <span className="badge bg-primary mt-2 animate-pulse px-2 py-1"><i className="bi bi-arrow-repeat me-1"></i> Running...</span>
                        )}
                      </div>
                    </div>

                    {/* Step 2 Card */}
                    <div className={`p-3 rounded-4 border transition-all ${simStep >= 2 ? 'border-success bg-success-subtle bg-opacity-10' : 'border-light bg-light'} d-flex gap-3 align-items-start`}>
                      <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${simStep >= 2 ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary'}`} style={{ width: '36px', height: '36px' }}>
                        {simStep > 2 ? <i className="bi bi-check-lg fw-bold"></i> : '2'}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1">Step 2: Voice Alert Broadcasted</h6>
                        <p className="small text-muted mb-0">Elderly phone rings and plays a loud Telugu audio notification warning.</p>
                        {simStep === 2 && (
                          <div className="d-flex gap-2 mt-2">
                            <span className="badge bg-danger animate-pulse px-2 py-1"><i className="bi bi-volume-up-fill me-1"></i> Phone Ringing</span>
                            <button className="btn btn-xs btn-outline-secondary p-1 py-0 fs-7" onClick={() => triggerStep2(profiles.find(p => p._id === selectedProfileId), selectedMedForSim)}>
                              <i className="bi bi-volume-up-fill me-1"></i> Play Voice Again
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3 Card */}
                    <div className={`p-3 rounded-4 border transition-all ${simStep === 3 || simStep === 5 ? 'border-success bg-success-subtle bg-opacity-10' : simStep === 4 ? 'border-warning bg-warning-subtle bg-opacity-10' : 'border-light bg-light'} d-flex gap-3 align-items-start`}>
                      <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${simStep === 3 || simStep === 5 ? 'bg-success text-white' : simStep === 4 ? 'bg-danger text-white' : 'bg-secondary-subtle text-secondary'}`} style={{ width: '36px', height: '36px' }}>
                        {simStep === 3 || simStep === 5 ? <i className="bi bi-check-lg fw-bold"></i> : simStep === 4 ? <i className="bi bi-x-lg fw-bold"></i> : '3'}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1">Step 3: Ram Rao Voice Confirmation</h6>
                        <p className="small text-muted mb-0">Ram Rao clicks and speaks "వేసుకున్నాను" (I have taken it). Status registered as Taken.</p>
                        {simStep === 2 && (
                          <div className="d-flex gap-2 mt-2">
                            <button className="btn btn-sm btn-success fw-bold text-white px-3" onClick={handleSpeechConfirmation}>
                              <i className="bi bi-mic-fill me-1"></i> Say "వేసుకున్నాను"
                            </button>
                            <button className="btn btn-sm btn-outline-danger px-2" onClick={handleSimulateMissedDose}>
                              Skip (30m delay)
                            </button>
                          </div>
                        )}
                        {simStep === 3 && (
                          <span className="badge bg-success mt-2 px-2 py-1"><i className="bi bi-shield-check me-1"></i> Dose Confirmed Taken</span>
                        )}
                      </div>
                    </div>

                    {/* Step 4 Card */}
                    <div className={`p-3 rounded-4 border transition-all ${simStep >= 4 ? 'border-danger bg-danger-subtle bg-opacity-10' : 'border-light bg-light'} d-flex gap-3 align-items-start`}>
                      <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${simStep >= 4 ? 'bg-danger text-white' : 'bg-secondary-subtle text-secondary'}`} style={{ width: '36px', height: '36px' }}>
                        {simStep >= 4 ? <i className="bi bi-exclamation-triangle-fill"></i> : '4'}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1">Step 4: Caregiver Fail-Safe Loop</h6>
                        <p className="small text-muted mb-0">If elder skips/forgets, system marks missed and triggers caregiver call reminder loop.</p>
                        {simStep === 4 && (
                          <div className="mt-2">
                            <button className="btn btn-sm btn-danger fw-bold text-white px-3" onClick={simulateCaregiverCall}>
                              <i className="bi bi-telephone-outbound-fill me-1"></i> Simulate Caregiver Call
                            </button>
                          </div>
                        )}
                        {simStep === 5 && (
                          <span className="badge bg-success mt-2 px-2 py-1"><i className="bi bi-telephone-fill me-1"></i> Caregiver Calling Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Device Mockups */}
                <div className="col-lg-4 d-flex align-items-center justify-content-center">
                  {/* Smartphone Mockup */}
                  <div className="phone-mockup border border-dark rounded-5 shadow-lg position-relative bg-dark p-2" style={{ width: '280px', height: '500px' }}>
                    <div className="phone-notch position-absolute bg-dark top-0 start-50 translate-middle-x rounded-bottom-4" style={{ width: '110px', height: '18px', zIndex: 10 }}></div>
                    <div className="phone-screen rounded-4 overflow-hidden position-relative bg-light d-flex flex-column" style={{ height: '100%' }}>
                      
                      {/* Phone Status Bar */}
                      <div className="d-flex justify-content-between align-items-center px-3 py-1 bg-dark text-white" style={{ fontSize: '0.7rem' }}>
                        <span>08:00 AM</span>
                        <div className="d-flex gap-1">
                          <i className="bi bi-wifi"></i>
                          <i className="bi bi-battery-full"></i>
                        </div>
                      </div>

                      {/* Phone Body Dynamic Content */}
                      <div className="flex-grow-1 p-3 d-flex flex-column justify-content-between text-center position-relative">
                        
                        {/* Eldercare App Header */}
                        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                          <i className="bi bi-heart-pulse-fill text-primary"></i>
                          <span className="fw-bold text-dark fs-7">ElderCare Guardian</span>
                        </div>

                        {/* Elder Ringing Screen (Step 2) */}
                        {(simStep === 2 || phoneRinging) && (
                          <div className="my-auto animate-fade-in d-flex flex-column gap-3 w-100">
                            <div className="pulse-ring-container mx-auto">
                              <div className="pulse-ring active"></div>
                              <div className="pulse-ring-inner bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', margin: 'auto' }}>
                                <i className="bi bi-telephone-inbound-fill display-5 animate-bounce"></i>
                              </div>
                            </div>
                            <div>
                              <h5 className="fw-bold mb-1 text-primary">మందుల హెచ్చరిక!</h5>
                              <p className="small text-muted mb-2">Voice Alert In Telugu</p>
                              
                              {/* Telugu Message Bubble */}
                              <div className="bg-white p-2 rounded-3 shadow-sm border border-info text-dark fw-bold mb-2" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                "{profiles.find(p => p._id === selectedProfileId)?.name || 'రామ్ రావు'} గారు, మీ మందులు వేసుకునే సమయం అయింది. దయచేసి {selectedMedForSim?.medicineName || 'Telmisartan'} టాబ్లెట్ తీసుకోండి."
                              </div>
                              
                              <p className="small text-muted fs-8">
                                <i className="bi bi-translate text-secondary me-1"></i>
                                "Mr. Ram Rao, it is time for your medicine. Please take your Telmisartan tablet."
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Elder Confirming Screen (Mic pulse / processing) */}
                        {micPulse && (
                          <div className="my-auto">
                            <div className="audio-visualizer-wave mb-3">
                              <span></span>
                              <span></span>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                            <h5 className="fw-bold text-success">Recognizing Voice...</h5>
                            <p className="text-muted small">"వేసుకున్నాను..."</p>
                          </div>
                        )}

                        {/* Elder Confirmed Screen (Step 3) */}
                        {simStep === 3 && (
                          <div className="my-auto animate-fade-in">
                            <i className="bi bi-check-circle-fill text-success display-1 mb-3 d-block"></i>
                            <h5 className="fw-bold text-success mb-1">Dose Confirmed Taken</h5>
                            <p className="small text-muted mb-3">Telugu recognized: <strong>"వేసుకున్నాను"</strong></p>
                            <span className="badge bg-success-subtle text-success border border-success border-opacity-20 px-3 py-2 rounded-pill fs-8 fw-semibold">
                              <i className="bi bi-shield-fill-check me-1"></i> Compliance: 100% Taken
                            </span>
                          </div>
                        )}

                        {/* Caregiver Alert Screen / Ramesh Phone Screen (Step 4 & 5) */}
                        {(simStep === 4 || simStep === 5) && (
                          <div className="w-100 h-100 d-flex flex-column justify-content-between p-1 bg-dark text-white rounded-3 overflow-hidden position-absolute top-0 start-0 z-3" style={{ transition: 'all 0.4s ease' }}>
                            <div className="w-100 text-center py-2 border-bottom border-secondary text-secondary small bg-black" style={{ fontSize: '0.65rem' }}>
                              <i className="bi bi-person-circle me-1"></i> Ramesh's Phone (Caregiver)
                            </div>
                            
                            {/* Slide-down Push Notification Banner */}
                            <div className="mt-2 mx-1 p-2 bg-danger bg-opacity-90 rounded-3 text-start border border-danger shadow-lg animate-slide-down" style={{ fontSize: '0.75rem' }}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-bold text-white"><i className="bi bi-exclamation-octagon-fill me-1 text-warning"></i> ElderCare Guardian Alert</span>
                                <span className="text-white opacity-75" style={{ fontSize: '0.6rem' }}>Now</span>
                              </div>
                              <p className="mb-0 text-white fw-semibold">
                                {simAlertNotification ? simAlertNotification.message : `Medicine Missed: Ram Rao did not confirm taking his 08:00 AM Telmisartan tablet.`}
                              </p>
                            </div>

                            <div className="my-auto px-2 text-center">
                              {simStep === 4 ? (
                                <>
                                  <i className="bi bi-exclamation-triangle-fill text-danger display-4 mb-2 animate-pulse d-block"></i>
                                  <h6 className="fw-bold text-danger mb-1">Fail-Safe Triggered!</h6>
                                  <p className="text-secondary fs-8 mb-4">Ram Rao missed the dose alert. Tap below to call him.</p>
                                  <button className="btn btn-sm btn-danger w-100 py-2 fw-bold" onClick={simulateCaregiverCall}>
                                    <i className="bi bi-telephone-outbound-fill me-1"></i> Call Ram Rao Directly
                                  </button>
                                </>
                              ) : (
                                <div className="animate-fade-in text-center">
                                  <i className="bi bi-telephone-fill text-success display-4 mb-2 d-block animate-bounce"></i>
                                  <h6 className="fw-bold text-success mb-1">Active Call to Father</h6>
                                  <p className="text-muted fs-8 mb-3">Speaking voice call reminder...</p>
                                  <div className="bg-secondary bg-opacity-25 p-2 rounded text-secondary fs-8 text-start italic">
                                    "Hey Dad, I saw you missed your BP tablet. Please take it now."
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pb-3 text-center">
                              <span className="text-muted fs-9">Emergency Contact Mode &amp; Active</span>
                            </div>
                          </div>
                        )}

                        {/* Starting/Idle screen (Step 1) */}
                        {simStep === 1 && (
                          <div className="my-auto">
                            <div className="spinner-grow text-info mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                              <span className="visually-hidden">Ticking clock...</span>
                            </div>
                            <h5 className="fw-bold mb-1 text-dark">08:00 AM Reached</h5>
                            <p className="small text-muted mb-0">Checking daily schedules...</p>
                          </div>
                        )}

                        {/* Screen Bottom Controls indicator */}
                        <div className="pt-2 text-center border-top border-light mt-auto" style={{ fontSize: '0.6rem' }}>
                          <span className="text-muted fw-semibold">SIMULATED PHONE VIEW</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Live Server Console Logs */}
                <div className="col-lg-4">
                  <div className="d-flex flex-column h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-terminal-fill me-2 text-dark"></i>Real-time Audit Logs</h5>
                      <span className="badge bg-black text-info font-monospace py-1 px-2 border border-info">MongoDB connected</span>
                    </div>
                    
                    <div className="flex-grow-1 bg-dark rounded-4 p-3 font-monospace text-success border border-secondary shadow-inner overflow-auto fs-8 d-flex flex-column-reverse" style={{ height: '340px', maxHeight: '340px' }}>
                      <div className="d-flex flex-column gap-2">
                        {simLog.length === 0 ? (
                          <div className="text-secondary italic text-center py-5">
                            Waiting for simulation logs... Click 'Start Alarm Simulation' to begin.
                          </div>
                        ) : (
                          [...simLog].reverse().map((log, index) => (
                            <div key={index} className="border-bottom border-secondary border-opacity-10 pb-1" style={{ wordBreak: 'break-all' }}>
                              {log}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 bg-light p-3 rounded-4 border">
                      <span className="fw-bold d-block text-dark small mb-1"><i className="bi bi-database-check text-primary me-1"></i>Database Integrity Audit</span>
                      <p className="text-muted fs-8 mb-0">
                        This simulator triggers real backend API transactions, updates real Mongoose documents, and generates database notifications. Open the caregiver dashboard to see the compliance reports update instantly!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
      {/* Calendar Day Detail Popup Modal */}
      {selectedCalendarDate && (
        <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm" style={{ maxWidth: '380px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <div className="modal-header bg-light border-0 py-2 px-3">
                <h6 className="modal-title fw-bold text-dark d-flex align-items-center">
                  <i className="bi bi-capsule-indicator text-primary me-2 fs-5"></i>
                  Date Log: {formatCalendarDate(selectedCalendarDate.dateStr)}
                </h6>
                <button type="button" className="btn-close" onClick={() => setSelectedCalendarDate(null)}></button>
              </div>
              <div className="modal-body p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="d-flex flex-column gap-2">
                  {selectedCalendarDate.logs.map((log, index) => {
                    let badgeClass = 'bg-secondary';
                    if (log.status === 'taken') badgeClass = 'bg-success';
                    else if (log.status === 'missed') badgeClass = 'bg-danger';
                    
                    return (
                      <div key={index} className="p-2 border rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#fafafa' }}>
                        <div style={{ maxWidth: '65%' }}>
                          <strong className="d-block small text-dark">{log.medicineName}</strong>
                          <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>{log.time} &bull; {log.dosage}</span>
                        </div>
                        <span className={`badge ${badgeClass} text-uppercase px-2 py-1.5`} style={{ fontSize: '0.68rem', borderRadius: '4px' }}>
                          {log.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer bg-light border-0 py-2 px-3">
                <button type="button" className="btn btn-secondary btn-sm px-3 fw-semibold" onClick={() => setSelectedCalendarDate(null)} style={{ borderRadius: '6px' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineManagement;
