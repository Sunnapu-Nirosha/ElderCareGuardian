import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';



const VoiceInteraction = () => {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedProfileName, setSelectedProfileName] = useState('Senior');
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [voiceLogs, setVoiceLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulation State
  const [activeScenario, setActiveScenario] = useState(null);
  const [speechStatus, setSpeechStatus] = useState('idle'); // idle, asking, awaiting_reply, listening_mic, processing
  const [activeText, setActiveText] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Speech Recognition setup reference
  const recognitionRef = useRef(null);
  const terminalRef = useRef(null);

  // Simulated Time Control & Automatic Trigger State
  const [useSystemClock, setUseSystemClock] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState('10:00 AM');
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('');
  const triggeredChecksRef = useRef({});

  // Audio Recording Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start audio capture stream
  const startAudioRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      console.log("Audio recording started.");
    } catch (err) {
      console.warn("Failed to start audio recording stream:", err);
    }
  };

  // Stop recording and upload base64 audio to MERN backend
  const stopAudioRecordingAndUpload = async (transcriptText) => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      submitResponse(transcriptText);
      return;
    }

    mediaRecorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

        // Stop all tracks to release red recording indicator
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;

          if (!activeScenario || !selectedProfileId) return;

          setSpeechStatus('processing');
          setActiveText(`Processing voice reply: "${transcriptText}"`);

          try {
            const res = await axios.post('/voice/upload', {
              elderlyId: selectedProfileId,
              rawText: transcriptText,
              language: 'Telugu',
              context: activeScenario.id,
              audio: base64Audio
            });

            if (res.data.success) {
              setSuccess(`Logged response and uploaded voice check-in!`);
              setSpeechStatus('idle');
              setActiveScenario(null);
              fetchLogsAndReport(selectedProfileId);
            }
          } catch (err) {
            console.error(err);
            setError('Failed to upload voice response to backend.');
            setSpeechStatus('idle');
            setActiveScenario(null);
          }
        };
      } catch (err) {
        console.error("Error creating audio upload payload:", err);
        submitResponse(transcriptText);
      }
    };

    mediaRecorder.stop();
  };

  // Dynamic scenarios generator combining default checks and active medicines
  const activeScenarios = React.useMemo(() => {
    const base = [
      {
        id: 'wellness',
        time: '8:00 AM',
        title: 'Daily Wellness Check',
        prompt: (name) => `హాయ్ ${name}, ఎలా ఉన్నావు? (Hi ${name}, yela vunnav?)`,
        promptTranslation: 'Hi yela vunnav?',
        replies: [
          { text: 'బాగున్నాను', translation: 'bavunnanu (Good)' },
          { text: 'సహాయం కావాలి', translation: 'sahayam kavali (Need Help)' }
        ],
        bgColor: 'rgba(25, 135, 84, 0.1)',
        textColor: '#198754'
      },
      {
        id: 'breakfast',
        time: '9:00 AM',
        title: 'Breakfast Check',
        prompt: () => 'టిఫిన్ చేశావా? (tiffin chesava?)',
        promptTranslation: 'Tiffin chesava?',
        replies: [
          { text: 'అవును', translation: 'avunu (Yes)' },
          { text: 'లేదు', translation: 'ledu (No)' }
        ],
        bgColor: 'rgba(13, 202, 240, 0.1)',
        textColor: '#0dcaf0'
      }
    ];

    // Add dynamic medicines with a default BP medication fallback if empty
    const activeMeds = medicines.length > 0 ? medicines : [
      {
        _id: 'default_bp_tablet',
        medicineName: 'BP Tablet',
        time: '02:00 PM',
        status: 'Active'
      }
    ];

    activeMeds.forEach(med => {
      base.push({
        id: `medicine_${med._id}`,
        time: med.time,
        title: `${med.medicineName} Reminder`,
        prompt: () => `${med.medicineName} వేసుకున్నావా? (${med.medicineName} veskunnava?)`,
        promptTranslation: `${med.medicineName} veskunnava?`,
        replies: [
          { text: 'వేసుకున్నాను', translation: 'veskunnanu (Taken)' },
          { text: 'వేసుకోలేదు', translation: 'veskoledhu (Not Taken)' }
        ],
        bgColor: 'rgba(13, 110, 253, 0.1)',
        textColor: '#0d6efd',
        isDynamicMed: true,
        medicineName: med.medicineName
      });
    });

    // Add lunch check
    base.push({
      id: 'lunch',
      time: '1:00 PM',
      title: 'Lunch Check',
      prompt: () => 'మధ్యాహ్న భోజనం చేశావా? (madhyahna bhojanam chesara?)',
      promptTranslation: 'Lunch chesara?',
      replies: [
        { text: 'అవును', translation: 'avunu (Yes)' },
        { text: 'లేదు', translation: 'ledu (No)' }
      ],
      bgColor: 'rgba(255, 193, 7, 0.1)',
      textColor: '#ffc107'
    });

    // Add dinner check
    base.push({
      id: 'dinner',
      time: '8:00 PM',
      title: 'Dinner Check',
      prompt: () => 'రాత్రి భోజనం చేశావా? (dinner chesara?)',
      promptTranslation: 'Dinner chesara?',
      replies: [
        { text: 'అవును', translation: 'avunu (Yes)' },
        { text: 'లేదు', translation: 'ledu (No)' }
      ],
      bgColor: 'rgba(111, 66, 193, 0.1)',
      textColor: '#6f42c1'
    });

    // Commands/Emergencies (expanded to match all critical categories)
    const commands = [
      {
        id: 'chest_pain',
        time: 'Anytime',
        title: 'Emergency: Chest Pain',
        prompt: null,
        replies: [
          { text: 'నాకు గుండె నొప్పిగా ఉంది', translation: 'gunde noppi (Chest Pain)' }
        ],
        bgColor: 'rgba(220, 53, 69, 0.1)',
        textColor: '#dc3545'
      },
      {
        id: 'dizziness',
        time: 'Anytime',
        title: 'Emergency: Dizziness',
        prompt: null,
        replies: [
          { text: 'నాకు తల తిరుగుతోంది', translation: 'thala thiruguthondi (Dizziness)' }
        ],
        bgColor: 'rgba(253, 126, 20, 0.1)',
        textColor: '#fd7e14'
      },
      {
        id: 'breathing_problem',
        time: 'Anytime',
        title: 'Emergency: Breathing',
        prompt: null,
        replies: [
          { text: 'నన్ను కాపాడండి ఊపిరి ఆడటం లేదు', translation: "save me, I can't breathe (Breathing Problem)" }
        ],
        bgColor: 'rgba(220, 53, 69, 0.15)',
        textColor: '#dc3545'
      },
      {
        id: 'fall',
        time: 'Anytime',
        title: 'Emergency: Fall',
        prompt: null,
        replies: [
          { text: 'నేను క్రింద పడిపోయాను', translation: 'I fell down (Fall)' }
        ],
        bgColor: 'rgba(220, 53, 69, 0.15)',
        textColor: '#dc3545'
      },
      {
        id: 'fever',
        time: 'Anytime',
        title: 'Health: Fever Alert',
        prompt: null,
        replies: [
          { text: 'నాకు జ్వరం వచ్చింది మరియు ఒళ్ళు నొప్పులుగా ఉన్నాయి', translation: 'I have fever & body aches (Fever)' }
        ],
        bgColor: 'rgba(253, 126, 20, 0.1)',
        textColor: '#fd7e14'
      },
      {
        id: 'help_command',
        time: 'Anytime',
        title: 'Voice Command: Help',
        prompt: null,
        replies: [
          { text: 'సహాయం కావాలి', translation: 'sahayam kavali (Need Help)' }
        ],
        bgColor: 'rgba(220, 53, 69, 0.15)',
        textColor: '#dc3545'
      },
      {
        id: 'help_me_command',
        time: 'Anytime',
        title: 'Voice Command: Help Me',
        prompt: null,
        replies: [
          { text: 'సహాయం చేయండి', translation: 'sahayam cheyandi (Help Me)' }
        ],
        bgColor: 'rgba(220, 53, 69, 0.15)',
        textColor: '#dc3545'
      },
      {
        id: 'son_command',
        time: 'Anytime',
        title: 'Voice Command: Call Son',
        prompt: null,
        replies: [
          { text: 'నా కొడుక్కి కాల్ చేయి', translation: 'na kodukki call cheyi (Call my son)' }
        ],
        bgColor: 'rgba(220, 53, 69, 0.15)',
        textColor: '#dc3545'
      }
    ];

    return { schedule: base, commands };
  }, [medicines, selectedProfileName]);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get('/profiles');
      if (res.data.success && res.data.data.length > 0) {
        setProfiles(res.data.data);
        const lakshmammaProf = res.data.data.find(p => p.name.toLowerCase().includes('lakshmamma'));
        if (lakshmammaProf) {
          setSelectedProfileId(lakshmammaProf._id);
          setSelectedProfileName(lakshmammaProf.name);
        } else {
          setSelectedProfileId(res.data.data[0]._id);
          setSelectedProfileName(res.data.data[0].name);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchLogsAndReport = async (profileId) => {
    if (!profileId) return;
    setLoading(true);
    try {
      const repRes = await axios.get(`/reports/weekly/${profileId}`);
      if (repRes.data.success) {
        setWeeklyReport(repRes.data.data);
      }
      const logRes = await axios.get(`/voice/elderly/${profileId}`);
      if (logRes.data.success) {
        setVoiceLogs(logRes.data.data);
      }
      const notifRes = await axios.get('/notifications');
      if (notifRes.data.success) {
        setNotifications(notifRes.data.data);
      }
      const medRes = await axios.get(`/medicines/elderly/${profileId}`);
      if (medRes.data.success) {
        setMedicines(medRes.data.data.filter(m => m.status === 'Active'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();

    // Initialize webkitSpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'te-IN'; // Default to Telugu speech recognition

      rec.onstart = () => {
        setSpeechStatus('listening_mic');
        setActiveText('Listening for your voice in Telugu...');
        startAudioRecording();
      };

      rec.onerror = (e) => {
        console.error('Speech Recognition Error:', e);
        setError('Voice input failed or timed out. Please try auto-reply simulation.');
        setSpeechStatus('awaiting_reply');
        setActiveText('');
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            mediaRecorderRef.current.stop();
            if (mediaRecorderRef.current.stream) {
              mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
          } catch (err) { }
        }
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        stopAudioRecordingAndUpload(transcript);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Clock Monitor interval effect for automatic voice prompts
  useEffect(() => {
    const interval = setInterval(() => {
      let now = new Date();
      let timeStr = "";

      if (useSystemClock) {
        timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        setCurrentTimeDisplay(timeStr);
      } else {
        timeStr = simulatedTime;
        setCurrentTimeDisplay(timeStr);
      }

      // Check for automatic scheduled triggers
      const todayStr = now.toISOString().split('T')[0];

      activeScenarios.schedule.forEach(scenario => {
        const formattedScenarioTime = scenario.time.replace(/^0/, '').trim();
        const formattedCurrentTime = timeStr.replace(/^0/, '').trim();

        if (formattedScenarioTime === formattedCurrentTime) {
          const triggerKey = `${todayStr}_${scenario.id}`;
          if (!triggeredChecksRef.current[triggerKey]) {
            triggeredChecksRef.current[triggerKey] = true;
            startScenario(scenario);
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [useSystemClock, simulatedTime, activeScenarios, medicines]);

  useEffect(() => {
    if (selectedProfileId) {
      fetchLogsAndReport(selectedProfileId);
    }
  }, [selectedProfileId]);

  const speakPrompt = (text) => {
    if (!text) return Promise.resolve();
    return new Promise((resolve) => {
      setSpeechStatus('asking');
      setActiveText(text);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'te-IN'; // Telugu voice synthesis

      const voices = window.speechSynthesis.getVoices();
      const teluguVoice = voices.find(v => v.lang.includes('te'));
      if (teluguVoice) {
        utterance.voice = teluguVoice;
      }

      utterance.onend = () => {
        resolve();
      };
      utterance.onerror = () => {
        resolve();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  };

  // Start scenario: Ask the question
  const startScenario = async (scenario) => {
    setActiveScenario(scenario);
    setSuccess('');
    setError('');

    if (terminalRef.current) {
      terminalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (scenario.prompt) {
      const promptString = scenario.prompt(selectedProfileName);
      await speakPrompt(promptString);
    }

    setSpeechStatus('awaiting_reply');
    setActiveText('');

    // Automatically trigger mic listening for hands-free reply
    if (recognitionRef.current) {
      try {
        setSpeechStatus('listening_mic');
        setActiveText('Listening for your voice in Telugu...');
        recognitionRef.current.start();
      } catch (err) {
        console.error('Auto Speech Recognition failed to start:', err);
      }
    }
  };

  // Start general microphone voice listening for any command or emergency
  const startGeneralListening = () => {
    setSuccess('');
    setError('');

    if (terminalRef.current) {
      terminalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setActiveScenario({
      id: 'general',
      title: 'General Voice Input',
      replies: [
        { text: 'బాగున్నాను', translation: 'bavunnanu (Good)' },
        { text: 'సహాయం కావాలి', translation: 'sahayam kavali (Need Help)' },
        { text: 'నా కొడుక్కి కాల్ చేయి', translation: 'na kodukki call cheyi (Call my son)' },
        { text: 'వేసుకున్నాను', translation: 'veskunnanu (Taken)' }
      ]
    });

    setSpeechStatus('listening_mic');
    setActiveText('Listening for your command in Telugu...');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
        try {
          recognitionRef.current.stop();
        } catch (stopErr) { }
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (startErr) { }
        }, 300);
      }
    } else {
      setSpeechStatus('awaiting_reply');
      setActiveText('');
    }
  };

  // Turn on real mic to listen
  const listenWithMic = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 300);
      }
    } else {
      setError('Speech recognition not supported in this browser. Please use the Simulate Reply button.');
    }
  };

  // Send speech text to MERN backend
  const submitResponse = async (responseText) => {
    if (!activeScenario || !selectedProfileId) return;

    setSpeechStatus('processing');
    setActiveText(`Captured: "${responseText}"`);

    try {
      const res = await axios.post('/voice/simulate', {
        elderlyId: selectedProfileId,
        rawText: responseText,
        language: 'Telugu',
        context: activeScenario.id
      });

      if (res.data.success) {
        setSuccess(`Logged reply: "${responseText}". DB Updated!`);
        setSpeechStatus('idle');
        setActiveScenario(null);
        fetchLogsAndReport(selectedProfileId);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to log response to backend.');
      setSpeechStatus('idle');
      setActiveScenario(null);
    }
  };

  // Simulate missed check-in silence
  const handleSimulateSilence = async () => {
    setSuccess('');
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/voice/simulate-missed', {
        elderlyId: selectedProfileId
      });
      if (res.data.success) {
        setSuccess('48h Missed Contact alert triggered! Check alerts feed.');
        fetchLogsAndReport(selectedProfileId);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to mock silence.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (hours) => {
    if (hours === 999) return { text: 'No Logs', color: 'bg-secondary' };
    if (hours >= 48) return { text: 'No Response (48h)', color: 'bg-danger animate-pulse' };
    if (hours >= 24) return { text: 'Warning: 24h Missed', color: 'bg-warning text-dark' };
    return { text: 'Good', color: 'bg-success' };
  };

  return (
    <div className="container-fluid">
      {/* Title bar */}
      <div className="row align-items-center mb-4">
        <div className="col-md-7 mb-3 mb-md-0">
          <h1 className="fw-bold mb-1">Interactive Scenario Simulator</h1>
          <p className="text-muted mb-0">Speak to {selectedProfileName || 'the patient'} via Text-to-Speech, receive their response (by microphone or simulation), and update the database.</p>
        </div>
        <div className="col-md-5 d-flex justify-content-md-end">
          <div className="d-flex align-items-center gap-2">
            <label className="fw-semibold text-muted small text-nowrap mb-0">Elderly Patient:</label>
            <select
              className="form-select form-control-custom shadow-sm bg-white"
              value={selectedProfileId}
              onChange={(e) => {
                setSelectedProfileId(e.target.value);
                const profName = profiles.find(p => p._id === e.target.value)?.name || 'Elderly';
                setSelectedProfileName(profName);
              }}
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
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm mb-4 animate-fade-in" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm mb-4 animate-fade-in" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="row g-4">
        {/* LEFT COLUMN: Senior Device Emulator */}
        <div className="col-xl-6">
          <div className="card-custom p-4 bg-white mb-4 shadow" ref={terminalRef} style={{ border: '2px solid var(--primary)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-primary">
                <i className="bi bi-phone-vibrate-fill me-2"></i>Senior Companion Terminal
              </h5>
              <span className="badge bg-success text-uppercase py-1 px-2" style={{ fontSize: '0.75rem' }}>Live Console</span>
            </div>

            <p className="text-muted small mb-4">
              Step-by-step: Click the microphone to speak directly, or select a schedule check below. {selectedProfileName || 'The patient'} can speak their reply or simulate any input!
            </p>

            {/* Clock Monitor & Simulation Panel */}
            <div className="card border-0 shadow-sm mb-4 bg-light p-3 rounded-3" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold text-dark"><i className="bi bi-clock-fill me-2 text-primary"></i>Companion Monitor Clock</span>
                <span className="badge bg-primary px-3 py-1 fs-6 font-monospace">{currentTimeDisplay || simulatedTime}</span>
              </div>

              <div className="row g-2 align-items-center mb-2">
                <div className="col-sm-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="clockModeSwitch"
                      checked={useSystemClock}
                      onChange={(e) => setUseSystemClock(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label small fw-semibold text-muted" htmlFor="clockModeSwitch" style={{ cursor: 'pointer' }}>
                      {useSystemClock ? 'Using Real System Clock' : 'Using Simulated Clock'}
                    </label>
                  </div>
                </div>

                <div className="col-sm-6 d-flex gap-1 justify-content-end">
                  {!useSystemClock && (
                    <div className="input-group input-group-sm" style={{ maxWidth: '140px' }}>
                      <input
                        type="text"
                        className="form-control text-center font-monospace"
                        value={simulatedTime}
                        onChange={(e) => setSimulatedTime(e.target.value)}
                        placeholder="e.g. 08:00 AM"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 border-top pt-2">
                <small className="text-muted d-block mb-2 fw-semibold">Fast Clock Simulation Triggers (Fires automatic Loud Voice Prompts):</small>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-sm btn-outline-success fw-bold shadow-sm"
                    onClick={() => {
                      setUseSystemClock(false);
                      setSimulatedTime('08:00 AM');
                      const todayStr = new Date().toISOString().split('T')[0];
                      delete triggeredChecksRef.current[`${todayStr}_wellness`];
                    }}
                  >
                    ⏰ Sim 8:00 AM (Wellness)
                  </button>
                  <button
                    className="btn btn-sm btn-outline-info fw-bold shadow-sm"
                    onClick={() => {
                      setUseSystemClock(false);
                      setSimulatedTime('09:00 AM');
                      const todayStr = new Date().toISOString().split('T')[0];
                      delete triggeredChecksRef.current[`${todayStr}_breakfast`];
                    }}
                  >
                    ⏰ Sim 9:00 AM (Breakfast)
                  </button>
                  <button
                    className="btn btn-sm btn-outline-warning fw-bold shadow-sm text-dark"
                    onClick={() => {
                      setUseSystemClock(false);
                      setSimulatedTime('01:00 PM');
                      const todayStr = new Date().toISOString().split('T')[0];
                      delete triggeredChecksRef.current[`${todayStr}_lunch`];
                    }}
                  >
                    ⏰ Sim 1:00 PM (Lunch)
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary fw-bold shadow-sm"
                    onClick={() => {
                      setUseSystemClock(false);
                      setSimulatedTime('02:00 PM');
                      const todayStr = new Date().toISOString().split('T')[0];
                      const medId = medicines.length > 0 ? medicines[0]._id : 'default_bp_tablet';
                      delete triggeredChecksRef.current[`${todayStr}_medicine_${medId}`];
                    }}
                  >
                    ⏰ Sim 2:00 PM (Medicine)
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary fw-bold shadow-sm"
                    onClick={() => {
                      setUseSystemClock(false);
                      setSimulatedTime('08:00 PM');
                      const todayStr = new Date().toISOString().split('T')[0];
                      delete triggeredChecksRef.current[`${todayStr}_dinner`];
                    }}
                  >
                    ⏰ Sim 8:00 PM (Dinner)
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Voice Terminal Console Visualizer */}
            <div className="glass-panel p-4 text-center rounded-3 mb-4 bg-dark-subtle border" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {speechStatus === 'idle' && (
                <div>
                  <button
                    className="btn bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 border-0 shadow-lg pulse-blue-mic"
                    onClick={startGeneralListening}
                    style={{ width: '85px', height: '85px', transition: 'transform 0.2s', cursor: 'pointer' }}
                    title="Click to speak a command directly"
                  >
                    <i className="bi bi-mic-fill fs-1"></i>
                  </button>
                  <h6 className="fw-bold text-dark mb-1">Terminal Ready</h6>
                  <small className="text-muted">Click the microphone button to speak directly, or select a schedule check below.</small>
                </div>
              )}

              {speechStatus === 'asking' && (
                <div>
                  <div className="audio-visualizer-wave mb-3">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <span className="badge bg-success text-uppercase px-3 py-1 mb-2 animate-pulse">Asking {selectedProfileName}</span>
                  <h5 className="fw-extrabold text-primary font-monospace mt-2">"{activeText}"</h5>
                  <small className="text-muted d-block mt-1">({activeScenario?.promptTranslation})</small>
                </div>
              )}

              {speechStatus === 'awaiting_reply' && (
                <div>
                  <span className="badge bg-warning text-dark text-uppercase px-3 py-1 mb-3 animate-pulse">Awaiting {selectedProfileName}'s Reply</span>

                  <div className="mb-4">
                    <span className="d-block text-muted small uppercase fw-bold mb-2">Speak one of these options:</span>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {activeScenario.replies.map((rep, idx) => (
                        <span key={idx} className="badge bg-light text-dark border p-2">
                          "{rep.text}" &bull; {rep.translation}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2 max-width-md mx-auto">
                    <button className="btn btn-danger py-2 w-100 fw-bold shadow-sm" onClick={listenWithMic}>
                      <i className="bi bi-mic-fill me-1"></i> Speak Answer (Microphone)
                    </button>

                    <div className="d-flex gap-2 w-100 mt-1">
                      {activeScenario.replies.map((rep, idx) => (
                        <button
                          key={idx}
                          className={`btn flex-grow-1 py-2 px-2 fw-bold shadow-sm text-truncate ${idx === 0 ? 'btn-success' : 'btn-outline-danger'}`}
                          onClick={() => submitResponse(rep.text)}
                          title={`Simulate: ${rep.text}`}
                        >
                          🤖 Simulate: "{rep.text}"
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 border-top pt-3 w-100" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      <label className="d-block text-muted small mb-1">Or type any custom voice input (simulated speech):</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. BP tablet veskunnaru, sahayam kavali..."
                          id="customSpeechInput"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              submitResponse(e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            const input = document.getElementById('customSpeechInput');
                            if (input && input.value) {
                              submitResponse(input.value);
                              input.value = '';
                            }
                          }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {speechStatus === 'listening_mic' && (
                <div>
                  <div className="audio-visualizer-wave mb-3">
                    <span style={{ backgroundColor: '#dc3545', animationDuration: '0.6s' }}></span>
                    <span style={{ backgroundColor: '#dc3545', animationDuration: '0.8s' }}></span>
                    <span style={{ backgroundColor: '#dc3545', animationDuration: '0.5s' }}></span>
                    <span style={{ backgroundColor: '#dc3545', animationDuration: '0.7s' }}></span>
                    <span style={{ backgroundColor: '#dc3545', animationDuration: '0.9s' }}></span>
                  </div>
                  <span className="badge bg-danger text-uppercase px-3 py-1 mb-2 animate-pulse">Microphone Active</span>
                  <h5 className="fw-bold text-danger font-monospace mt-2">Speak into your mic in Telugu...</h5>
                  <div className="mt-2 text-muted small mb-3">
                    Expected: {activeScenario.replies.map(r => `"${r.text}"`).join(' or ')}
                  </div>
                  <div className="d-flex justify-content-center gap-2 max-width-md mx-auto" style={{ maxWidth: '280px' }}>
                    <button
                      className="btn btn-sm btn-outline-danger w-100 fw-bold"
                      onClick={() => {
                        if (recognitionRef.current) {
                          try {
                            recognitionRef.current.stop();
                          } catch (err) { }
                        }
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                          try {
                            mediaRecorderRef.current.stop();
                            if (mediaRecorderRef.current.stream) {
                              mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                            }
                          } catch (err) { }
                        }
                        setSpeechStatus('awaiting_reply');
                        setActiveText('');
                      }}
                    >
                      <i className="bi bi-x-circle me-1"></i> Stop & Use Simulator
                    </button>
                  </div>
                </div>
              )}

              {speechStatus === 'processing' && (
                <div>
                  <div className="spinner-border text-info mb-3" role="status">
                    <span className="visually-hidden">NLP Processing...</span>
                  </div>
                  <h6 className="fw-bold text-info mb-1">{activeText}</h6>
                  <small className="text-muted">Updating meals, medicines, and alerts database collections...</small>
                </div>
              )}
            </div>

            {/* Scenario buttons checkpoints grid */}
            <h6 className="fw-bold mb-3 text-muted uppercase small" style={{ letterSpacing: '1px' }}>Wellness Scenario Buttons</h6>

            {/* Daily Schedule Checks */}
            <div className="row g-2 mb-3">
              {activeScenarios.schedule.map((s) => (
                <div className="col-sm-6 col-md-4" key={s.id}>
                  <button
                    className="btn w-100 text-start border shadow-sm p-3 h-100"
                    onClick={() => startScenario(s)}
                    disabled={speechStatus !== 'idle'}
                    style={{ backgroundColor: s.bgColor, borderColor: 'transparent', transition: 'all 0.2s' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small" style={{ color: s.textColor }}>{s.time} - {s.title}</span>
                      <i className="bi bi-play-circle-fill" style={{ color: s.textColor }}></i>
                    </div>
                    <small className="d-block text-muted text-wrap" style={{ fontSize: '0.75rem' }}>
                      {s.prompt ? `Ask: "${s.promptTranslation}"` : `Ask: Awaiting voice input`}
                    </small>
                  </button>
                </div>
              ))}
            </div>

            {/* Emergency & Symptoms triggers */}
            <h6 className="fw-bold mb-3 text-muted uppercase small" style={{ letterSpacing: '1px' }}>Emergencies & Commands</h6>
            <div className="row g-2 mb-4">
              {activeScenarios.commands.map((s) => (
                <div className="col-sm-6" key={s.id}>
                  <button
                    className="btn w-100 text-start border shadow-sm p-3 h-100"
                    onClick={() => startScenario(s)}
                    disabled={speechStatus !== 'idle'}
                    style={{ backgroundColor: s.bgColor, borderColor: 'transparent', transition: 'all 0.2s' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small" style={{ color: s.textColor }}>{s.title}</span>
                      <i className="bi bi-chat-left-dots-fill" style={{ color: s.textColor }}></i>
                    </div>
                    <small className="d-block text-muted text-wrap" style={{ fontSize: '0.75rem' }}>
                      Senior speaks: "{s.replies[0].translation}"
                    </small>
                  </button>
                </div>
              ))}
            </div>

            <h6 className="fw-bold mb-3 text-muted uppercase small" style={{ letterSpacing: '1px' }}>Anomalous Conditions</h6>
            <div className="p-3 border rounded-3 bg-light-subtle d-flex flex-wrap gap-2 justify-content-between align-items-center">
              <div>
                <strong className="d-block small text-dark">Missed Contact Simulation (48 hours)</strong>
                <small className="text-muted text-wrap" style={{ fontSize: '0.78rem' }}>
                  Simulates 48 hours of silence with no response received from {selectedProfileName}.
                </small>
              </div>
              <button
                className="btn btn-sm btn-outline-danger shadow-sm py-2 px-3 fw-bold"
                onClick={handleSimulateSilence}
                disabled={loading || speechStatus !== 'idle'}
              >
                <i className="bi bi-clock-history me-1"></i> Trigger Silence
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Son's Guardian Oversight View */}
        <div className="col-xl-6">
          <div className="card-custom p-4 bg-white mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-shield-check text-success me-2"></i>Son's Guardian Dashboard
              </h5>
              <span className="text-muted small">Live sync status</span>
            </div>

            {weeklyReport ? (
              <div className="row g-3">
                <div className="col-12 d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-2">
                  <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                    {selectedProfileName.charAt(0)}
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{selectedProfileName}</h5>
                    <small className="text-muted">Mother &bull; Age: {weeklyReport.profile.age} yrs</small>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100 bg-white">
                    <small className="text-muted d-block fw-semibold text-uppercase small">Health Status</small>
                    <span className={`badge ${getStatusBadge(weeklyReport.contactStatus.hoursSinceLastCheckin).color} mt-2 d-inline-block px-3 py-2 fs-7`}>
                      {weeklyReport.contactStatus.hoursSinceLastCheckin >= 48 ? 'Critical Attention' : 'Good'}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100 bg-white">
                    <small className="text-muted d-block fw-semibold text-uppercase small">BP Medication</small>
                    <span className={`badge mt-2 d-inline-block px-3 py-2 fs-7 ${weeklyReport.medication.compliancePercentage > 0 ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {weeklyReport.medication.compliancePercentage > 0 ? 'Taken' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100 bg-white">
                    <small className="text-muted d-block fw-semibold text-uppercase small">Lunch Checklist</small>
                    <span className={`badge mt-2 d-inline-block px-3 py-2 fs-7 ${weeklyReport.meals.completedCount > 0 ? 'bg-success' : (weeklyReport.meals.skippedCount > 0 ? 'bg-danger' : 'bg-secondary')
                      }`}>
                      {weeklyReport.meals.completedCount > 0 ? 'Confirmed' : (weeklyReport.meals.skippedCount > 0 ? 'Skipped' : 'Pending')}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100 bg-white">
                    <small className="text-muted d-block fw-semibold text-uppercase small">Current Mood</small>
                    <span className="badge bg-info-subtle text-info mt-2 d-inline-block px-3 py-2 fs-7">
                      {weeklyReport.mood.recentLogs.length > 0
                        ? '😊 ' + weeklyReport.mood.recentLogs[0].mood
                        : '😊 Happy'}
                    </span>
                  </div>
                </div>

                <div className="col-12 mt-2">
                  <div className="p-3 border border-dashed rounded-3 bg-light-subtle d-flex justify-content-between align-items-center">
                    <small className="text-muted">Last Contact Recorded:</small>
                    <strong className="text-dark small">
                      {weeklyReport.contactStatus.hoursSinceLastCheckin === 999
                        ? 'Never'
                        : weeklyReport.contactStatus.hoursSinceLastCheckin === 0
                          ? 'Just now (within last hour)'
                          : `${weeklyReport.contactStatus.hoursSinceLastCheckin} hours ago`}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="skeleton" style={{ height: '200px' }}></div>
            )}
          </div>

          {/* Active alerts logs feed */}
          <div className="card-custom p-4 bg-white mb-4 shadow-sm" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <h6 className="fw-bold mb-3 text-dark border-bottom pb-2">
              <i className="bi bi-bell-fill text-danger me-2"></i>Active Family Alerts & Notifications
            </h6>

            {notifications.length === 0 ? (
              <p className="text-muted text-center py-4 small mb-0">No active emergency warnings or alarms.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {notifications.slice(0, 4).map((notif) => {
                  let alertClass = 'alert-info';
                  if (notif.title.includes('URGENT') || notif.title.includes('Emergency') || notif.title.includes('Critical')) {
                    alertClass = 'alert-danger';
                  } else if (notif.title.includes('Warning') || notif.title.includes('Concern')) {
                    alertClass = 'alert-warning';
                  }
                  return (
                    <div className={`alert ${alertClass} p-3 mb-0 border-0 rounded-3 d-flex align-items-start gap-2 shadow-sm`} key={notif._id}>
                      <i className={`bi ${alertClass === 'alert-danger' ? 'bi-exclamation-octagon-fill' : 'bi-info-circle-fill'} fs-5`}></i>
                      <div className="flex-grow-1">
                        <strong className="d-block small text-uppercase" style={{ letterSpacing: '0.5px' }}>{notif.title}</strong>
                        <span className="small text-wrap d-block mt-1" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>{notif.message}</span>
                        <small className="text-muted d-block mt-2 font-monospace" style={{ fontSize: '0.7rem' }}>
                          {new Date(notif.createdAt).toLocaleTimeString()} &bull; {new Date(notif.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical voice log table list */}
      <div className="row g-4 mt-2">
        <div className="col-12">
          <div className="card-custom p-4 bg-white mb-4 shadow-sm">
            <h5 className="fw-bold mb-3 text-dark"><i className="bi bi-clock-history me-2"></i>Simulated Voice Interactions History Log</h5>
            {voiceLogs.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No voice logs captured yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom table-hover">
                  <thead>
                    <tr>
                      <th>Voice Input Spoken</th>
                      <th>AI Decoded Intent</th>
                      <th>Risk Severity</th>
                      <th>Time Captured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voiceLogs.slice(0, 10).map((log) => {
                      let badgeColor = 'bg-success';
                      if (log.riskLevel === 'Critical' || log.riskLevel === 'High') {
                        badgeColor = 'bg-danger';
                      } else if (log.riskLevel === 'Medium') {
                        badgeColor = 'bg-warning text-dark';
                      }
                      return (
                        <tr key={log._id}>
                          <td>
                            <strong>{log.transcription}</strong>
                            <small className="d-block text-muted font-monospace mb-2" style={{ fontSize: '0.72rem' }}>
                              Audio clip file: {log.audioFile}
                            </small>
                            {log.audioFile && log.audioFile !== 'simulated_audio_clip.wav' && (
                              <div className="mt-1" style={{ maxWidth: '280px' }}>
                                <audio
                                  src={`http://localhost:5000/${log.audioFile}`}
                                  controls
                                  className="w-100"
                                  style={{ height: '30px' }}
                                />
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary">
                              {log.intent}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${badgeColor}`}>
                              {log.riskLevel}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted d-block">{new Date(log.createdAt).toLocaleDateString()}</small>
                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleTimeString()}</small>
                          </td>
                        </tr>
                      );
                    })}
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

export default VoiceInteraction;
