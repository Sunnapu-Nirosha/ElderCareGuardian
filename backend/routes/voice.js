const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const VoiceResponse = require('../models/VoiceResponse');
const ElderlyProfile = require('../models/ElderlyProfile');
const EmergencyAlert = require('../models/EmergencyAlert');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Simulated language transcription database
const SIMULATIONS = [
  // Telugu
  {
    rawText: "నాకు తల తిరుగుతోంది",
    language: "Telugu",
    transcription: "I am feeling dizzy",
    intent: "Dizziness",
    riskLevel: "Medium",
    alertType: "Dizziness"
  },
  {
    rawText: "నా గుండె నొప్పిగా ఉంది",
    language: "Telugu",
    transcription: "I have chest pain",
    intent: "Chest Pain",
    riskLevel: "Critical",
    alertType: "Chest Pain"
  },
  {
    rawText: "నన్ను కాపాడండి ఊపిరి ఆడటం లేదు",
    language: "Telugu",
    transcription: "Save me, I can't breathe",
    intent: "Breathing Problem",
    riskLevel: "High",
    alertType: "Breathing Problem"
  },
  {
    rawText: "సహాయం చేయండి",
    language: "Telugu",
    transcription: "Help me",
    intent: "Help",
    riskLevel: "Critical",
    alertType: "Help"
  },
  {
    rawText: "నేను క్రింద పడిపోయాను",
    language: "Telugu",
    transcription: "I fell down",
    intent: "Fall",
    riskLevel: "High",
    alertType: "Fall"
  },
  {
    rawText: "నాకు జ్వరం వచ్చింది మరియు ఒళ్ళు నొప్పులుగా ఉన్నాయి",
    language: "Telugu",
    transcription: "I have a fever and body aches",
    intent: "Fever",
    riskLevel: "Medium",
    alertType: "Fever"
  },

  // Hindi
  {
    rawText: "मुझे चक्कर आ रहा है",
    language: "Hindi",
    transcription: "I am feeling dizzy",
    intent: "Dizziness",
    riskLevel: "Medium",
    alertType: "Dizziness"
  },
  {
    rawText: "मेरी छाती में दर्द हो रहा है",
    language: "Hindi",
    transcription: "I have pain in my chest",
    intent: "Chest Pain",
    riskLevel: "Critical",
    alertType: "Chest Pain"
  },
  {
    rawText: "बचाओ मुझे सांस लेने में तकलीफ हो रही है",
    language: "Hindi",
    transcription: "Help me, I am having trouble breathing",
    intent: "Breathing Problem",
    riskLevel: "High",
    alertType: "Breathing Problem"
  },
  {
    rawText: "मुझे मदद चाहिए",
    language: "Hindi",
    transcription: "I need help",
    intent: "Help",
    riskLevel: "Critical",
    alertType: "Help"
  },
  {
    rawText: "मैं फर्श पर गिर गया और उठ नहीं पा रहा हूँ",
    language: "Hindi",
    transcription: "I fell on the floor and cannot get up",
    intent: "Fall",
    riskLevel: "High",
    alertType: "Fall"
  },
  {
    rawText: "मुझे तेज़ बुखार महसूस हो रहा है",
    language: "Hindi",
    transcription: "I am feeling high fever",
    intent: "Fever",
    riskLevel: "Medium",
    alertType: "Fever"
  },

  // Spanish
  {
    rawText: "Me siento mareado",
    language: "Spanish",
    transcription: "I am feeling dizzy",
    intent: "Dizziness",
    riskLevel: "Medium",
    alertType: "Dizziness"
  },
  {
    rawText: "Tengo un fuerte dolor en el pecho",
    language: "Spanish",
    transcription: "I have a strong pain in my chest",
    intent: "Chest Pain",
    riskLevel: "Critical",
    alertType: "Chest Pain"
  },
  {
    rawText: "Ayuda por favor no puedo respirar",
    language: "Spanish",
    transcription: "Help please I cannot breathe",
    intent: "Breathing Problem",
    riskLevel: "High",
    alertType: "Breathing Problem"
  },
  {
    rawText: "¡Ayuda!",
    language: "Spanish",
    transcription: "Help!",
    intent: "Help",
    riskLevel: "Critical",
    alertType: "Help"
  },
  {
    rawText: "Me caí y no puedo levantarme",
    language: "Spanish",
    transcription: "I fell and cannot get up",
    intent: "Fall",
    riskLevel: "High",
    alertType: "Fall"
  },
  {
    rawText: "Tengo mucha fiebre y frío",
    language: "Spanish",
    transcription: "I have a high fever and feel cold",
    intent: "Fever",
    riskLevel: "Medium",
    alertType: "Fever"
  },

  // English
  {
    rawText: "I am feeling dizzy",
    language: "English",
    transcription: "I am feeling dizzy",
    intent: "Dizziness",
    riskLevel: "Medium",
    alertType: "Dizziness"
  },
  {
    rawText: "I have a sudden chest pain",
    language: "English",
    transcription: "I have a sudden chest pain",
    intent: "Chest Pain",
    riskLevel: "Critical",
    alertType: "Chest Pain"
  },
  {
    rawText: "I can't breathe properly",
    language: "English",
    transcription: "I can't breathe properly",
    intent: "Breathing Problem",
    riskLevel: "High",
    alertType: "Breathing Problem"
  },
  {
    rawText: "Please help me quickly",
    language: "English",
    transcription: "Please help me quickly",
    intent: "Help",
    riskLevel: "Critical",
    alertType: "Help"
  }
];

/**
 * Calls the Gemini 1.5 Flash API to parse voice text.
 * Returns structured classification or null on failure/key-missing.
 */
const parseVoiceIntent = async (rawText, language, context) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('Gemini API key not configured. Using local keywords lookup.');
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `
      You are the NLP engine for "AI ElderCare Guardian", a remote monitoring system for seniors.
      
      The senior spoke in their native language (${language || 'Telugu'}): "${rawText}".
      The current context of the prompt is: "${context || 'general'}".
      
      Perform the following tasks:
      1. Translate the message into clear English (saved as "transcription").
      2. Classify the intent of the message. Choose from:
         - "Chest Pain", "Dizziness", "Fall", "Help", "Breathing Problem", "Fever" (Critical/High alerts)
         - "Daily Wellness Check" (when stating they are fine/good/healthy)
         - "Mood Concern" (stating loneliness, sadness, isolation)
         - "Medicine Confirmation" (marking medication taken or missed)
         - "Meal Confirmation" (marking meal complete or skipped)
         - "Conversation" (casual talk or other general statements)
      3. Classify clinical riskLevel. Choose EXACTLY one: "Low", "Medium", "High", "Critical".
      4. Classify alertType. Choose EXACTLY one: "Chest Pain", "Dizziness", "Fall", "Help", "Breathing Problem", "Fever", "Other".
      
      Return ONLY a raw, valid JSON object. Do NOT wrap it in markdown block quotes (no \`\`\`json). The JSON structure MUST be:
      {
        "transcription": "English translation here",
        "intent": "Intent classification",
        "riskLevel": "Low | Medium | High | Critical",
        "alertType": "Chest Pain | Dizziness | Fall | Help | Breathing Problem | Fever | Other"
      }
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini status code ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Empty response content from Gemini');
    }

    // Clean brackets or formatting if the model outputted it
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    return result;
  } catch (error) {
    console.error('Gemini NLP voice processing failed:', error.message);
    return null;
  }
};

/**
 * Helper to process the matched intents and trigger Mongoose updates
 */
const processVoiceResponse = async ({ elderlyId, rawText, language, context, date, audioFileName }) => {
  const profile = await ElderlyProfile.findById(elderlyId);
  if (!profile) {
    throw new Error('Elderly profile not found');
  }

  let alertCreated = false;
  const activeDate = date || new Date().toISOString().split('T')[0];

  // 1. Try Gemini NLP first if configured
  let match = null;
  if (process.env.GEMINI_API_KEY) {
    match = await parseVoiceIntent(rawText, language || profile.preferredLanguage, context);
  }

  // 2. If Gemini didn't run/succeeded, try matching with SIMULATIONS list
  if (!match) {
    match = SIMULATIONS.find(s => s.rawText.toLowerCase() === rawText.trim().toLowerCase());
  }

  // 3. If still no match, fall back to keyword logic
  if (!match) {
    let englishText = rawText; // Fallback assumes English
    let detectedIntent = 'Conversation';
    let risk = 'Low';
    let alertType = 'Other';

    const text = rawText.toLowerCase();

    // Telugu scenario matching
    if (text.includes('గుండె నొప్పి') || text.includes('chest pain') || text.includes('gunde noppi')) {
      detectedIntent = 'Chest Pain';
      risk = 'High';
      alertType = 'Chest Pain';
      englishText = 'I have chest pain';
    } else if (text.includes('తల తిరుగు') || text.includes('dizzy') || text.includes('thala thiruguthondi')) {
      detectedIntent = 'Dizziness';
      risk = 'Medium';
      alertType = 'Dizziness';
      englishText = 'I feel dizzy';
    } else if (text.includes('సహాయం') || text.includes('sahayam') || text.includes('help') || text.includes('కాపాడండి') || text.includes('kapadandi') || text.includes('save me')) {
      detectedIntent = 'Help';
      risk = 'Critical';
      alertType = 'Help';
      englishText = 'I need help';
    } else if (text.includes('కొడుక్కి కాల్ చేయి') || text.includes('kodukki call cheyi')) {
      detectedIntent = 'Emergency Voice Command';
      risk = 'Critical';
      alertType = 'Help';
      englishText = 'Call my son';
    } else if (text.includes('బాగున్నాను') || text.includes('bagunnanu') || text.includes('bavunnanu') || text.includes('fine') || text.includes('good')) {
      detectedIntent = 'Daily Wellness Check';
      risk = 'Low';
      alertType = 'Other';
      englishText = 'I am fine';
    } else if (text.includes('ఒంటరిగా') || text.includes('ontariga') || text.includes('lonely')) {
      detectedIntent = 'Mood Concern';
      risk = 'Low';
      alertType = 'Other';
      englishText = 'I am feeling lonely';
    } else if (text.includes('ఎవరూ మాట్లాడటం లేదు') || text.includes('evaroo matladadam ledu') || text.includes('nobody')) {
      detectedIntent = 'Mood Concern';
      risk = 'Low';
      alertType = 'Other';
      englishText = 'Nobody is talking to me';
    } else if (text.includes('లేదు') || text.includes('ledu') || text.includes('no')) {
      detectedIntent = 'Lunch Skipped';
      risk = 'Low';
      alertType = 'Other';
      englishText = 'No';
    } else if (text.includes('అవును') || text.includes('avunu') || text.includes('yes')) {
      detectedIntent = context === 'lunch' ? 'Lunch Confirmation' : 'Medicine Confirmation';
      risk = 'Low';
      alertType = 'Other';
      englishText = 'Yes';
    } else if (text.includes('breath') || text.includes('ఊపిరి') || text.includes('సాన్స్') || text.includes('breathe')) {
      detectedIntent = 'Breathing Problem';
      risk = 'High';
      alertType = 'Breathing Problem';
      englishText = 'I have a breathing problem';
    } else if (text.includes('fever') || text.includes('జ్వరం') || text.includes('jwaram')) {
      detectedIntent = 'Fever';
      risk = 'Medium';
      alertType = 'Fever';
      englishText = 'I have a fever';
    } else if (text.includes('fall') || text.includes('పడిపోయాను') || text.includes('padipoyanu')) {
      detectedIntent = 'Fall';
      risk = 'High';
      alertType = 'Fall';
      englishText = 'I fell down';
    }

    match = {
      transcription: englishText,
      intent: detectedIntent,
      riskLevel: risk,
      alertType
    };
  }

  // DB side-effects based on mapped commands/intents
  const rawTextTrimmed = rawText.trim().toLowerCase().replace(/[.,?/]/g, '');

  const isWellnessCommand = (rawTextTrimmed === 'బాగున్నాను' || rawTextTrimmed === 'bagunnanu' || rawTextTrimmed === 'bavunnanu' || rawTextTrimmed === 'bhavunnanu' || rawTextTrimmed === 'bagunanu' || rawTextTrimmed === 'bavunanu') || (match.intent === 'Daily Wellness Check');
  const isHelpCommand = (rawTextTrimmed === 'సహాయం కావాలి' || rawTextTrimmed === 'sahayam kavali' || rawTextTrimmed === 'sahayam kaavali' || rawTextTrimmed === 'సహాయం కావాలి.' || rawTextTrimmed === 'సహాయం చేయండి' || rawTextTrimmed === 'sahayam cheyandi') || (match.intent === 'Emergency Request' || match.intent === 'Help');
  const isLonelyCommand = (rawTextTrimmed === 'ఒంటరిగా అనిపిస్తోంది' || rawTextTrimmed === 'ontariga anipisthondi') || (match.intent === 'Mood Concern' && match.transcription.toLowerCase().includes('lonely'));
  const isIsolatedCommand = (rawTextTrimmed === 'ఎవరూ మాట్లాడటం లేదు' || rawTextTrimmed === 'evaroo matladadam ledu') || (match.intent === 'Mood Concern' && match.transcription.toLowerCase().includes('nobody'));
  const isChestPainCommand = (rawTextTrimmed === 'నాకు గుండె నొప్పిగా ఉంది' || rawTextTrimmed === 'gunde noppi' || rawTextTrimmed === 'gunde noppi ga undi') || (match.intent === 'Chest Pain');
  const isDizzinessCommand = (rawTextTrimmed === 'నాకు తల తిరుగుతోంది' || rawTextTrimmed === 'thala thiruguthondi' || rawTextTrimmed === 'తల తిరుగుతోంది') || (match.intent === 'Dizziness');
  const isEmergencyCallCommand = (rawTextTrimmed === 'నా కొడుక్కి కాల్ చేయి' || rawTextTrimmed === 'na kodukki call cheyi') || (match.intent === 'Emergency Voice Command');

  if (isWellnessCommand) {
    const WellnessCheck = require('../models/WellnessCheck');
    const MoodLog = require('../models/MoodLog');

    await WellnessCheck.findOneAndUpdate(
      { elderlyId, date: activeDate },
      { response: `${rawText} (${match.transcription})`, healthStatus: 'Good', remarks: 'Daily wellness check logged via voice' },
      { upsert: true, new: true }
    );

    await MoodLog.findOneAndUpdate(
      { elderlyId, date: activeDate },
      { mood: 'Happy', score: 5 },
      { upsert: true, new: true }
    );
  } 
  else if (isHelpCommand) {
    const WellnessCheck = require('../models/WellnessCheck');
    
    await WellnessCheck.findOneAndUpdate(
      { elderlyId, date: activeDate },
      { response: `${rawText} (${match.transcription})`, healthStatus: 'Needs Help', remarks: 'Daily wellness check triggered help request' },
      { upsert: true, new: true }
    );

    await EmergencyAlert.create({
      elderlyId,
      alertType: 'Help',
      severity: 'Critical',
      description: `Emergency: ${profile.name} reported needing help during check-in.`
    });

    await Notification.create({
      userId: profile.createdBy,
      title: 'Emergency: Help Requested',
      message: `${profile.name} said: "${rawText}" (${match.transcription}) during check-in.`,
      type: 'Emergency Detected'
    });

    alertCreated = true;
  }
  else if (isLonelyCommand) {
    const MoodLog = require('../models/MoodLog');
    const WellnessCheck = require('../models/WellnessCheck');

    await MoodLog.findOneAndUpdate(
      { elderlyId, date: activeDate },
      { mood: 'Lonely', score: 1 },
      { upsert: true, new: true }
    );

    await WellnessCheck.findOneAndUpdate(
      { elderlyId, date: activeDate },
      { response: `${rawText} (${match.transcription})`, healthStatus: 'Normal', remarks: 'Lonely mood response logged' },
      { upsert: true, new: true }
    );

    await Notification.create({
      userId: profile.createdBy,
      title: 'Mood Concern: Lonely',
      message: `${profile.name} reported feeling lonely. Spoke: "${rawText}"`,
      type: 'Mood Concern'
    });
  }
  else if (isIsolatedCommand) {
    const MoodLog = require('../models/MoodLog');
    const WellnessCheck = require('../models/WellnessCheck');

    await MoodLog.findOneAndUpdate(
      { elderlyId, date: activeDate },
      { mood: 'Lonely', score: 1 },
      { upsert: true, new: true }
    );

    await WellnessCheck.findOneAndUpdate(
      { elderlyId, date: activeDate },
      { response: `${rawText} (${match.transcription})`, healthStatus: 'Normal', remarks: 'Isolated mood response logged' },
      { upsert: true, new: true }
    );

    await Notification.create({
      userId: profile.createdBy,
      title: 'Mood Concern: Isolated',
      message: `${profile.name} reported: "Nobody is talking to me". Spoke: "${rawText}"`,
      type: 'Mood Concern'
    });
  }
  else if (isChestPainCommand) {
    const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    await EmergencyAlert.create({
      elderlyId,
      alertType: 'Chest Pain',
      severity: 'High',
      description: `URGENT ALERT\n\n${profile.name} reported chest pain.\n\nTime:\n${timeString}`
    });

    await Notification.create({
      userId: profile.createdBy,
      title: 'URGENT ALERT',
      message: `${profile.name} reported chest pain. Time: ${timeString}`,
      type: 'Emergency Detected'
    });

    alertCreated = true;
  }
  else if (isDizzinessCommand) {
    await EmergencyAlert.create({
      elderlyId,
      alertType: 'Dizziness',
      severity: 'Medium',
      description: `${profile.name} reported dizziness.`
    });

    await Notification.create({
      userId: profile.createdBy,
      title: 'Health Alert: Dizziness',
      message: `${profile.name} reported feeling dizzy.`,
      type: 'Health Concern'
    });

    alertCreated = true;
  }
  else if (isEmergencyCallCommand) {
    await EmergencyAlert.create({
      elderlyId,
      alertType: 'Help',
      severity: 'Critical',
      description: `Emergency Mode Activated: Senior voice command "${rawText}"`
    });

    await Notification.create({
      userId: profile.createdBy,
      title: 'Emergency Mode Activated',
      message: `Emergency command activated by ${profile.name}: "${rawText}"`,
      type: 'Emergency Detected'
    });

    alertCreated = true;
  }

  // Now check if it's a medicine context or meal context
  let isMedicineContext = (context === 'medicine' || (typeof context === 'string' && context.startsWith('medicine_')));
  let isMealContext = (context === 'breakfast' || context === 'lunch' || context === 'dinner');
  let mealTimeContext = context;

  if (context === 'general' || !context) {
    const textForCheck = rawTextTrimmed.toLowerCase();
    if (textForCheck.includes('veskunnanu') || textForCheck.includes('వేసుకున్నాను') || 
        textForCheck.includes('veskoledhu') || textForCheck.includes('వేసుకోలేదు') ||
        textForCheck.includes('tablet') || textForCheck.includes('మందు') || textForCheck.includes('pill') || textForCheck.includes('medicine')) {
      isMedicineContext = true;
    } else if (textForCheck.includes('tiffin') || textForCheck.includes('breakfast') || textForCheck.includes('టిఫిన్')) {
      isMealContext = true;
      mealTimeContext = 'breakfast';
    } else if (textForCheck.includes('dinner') || textForCheck.includes('రాత్రి భోజనం') || textForCheck.includes('రాత్రి') || textForCheck.includes('dinner')) {
      isMealContext = true;
      mealTimeContext = 'dinner';
    } else if (textForCheck.includes('lunch') || textForCheck.includes('భోజనం') || textForCheck.includes('tinnanu') || textForCheck.includes('తినాను') || textForCheck.includes('తిన్నాను') || textForCheck.includes('bhojanam')) {
      const currentHour = new Date().getHours();
      isMealContext = true;
      if (currentHour >= 16) {
        mealTimeContext = 'dinner';
      } else {
        mealTimeContext = 'lunch';
      }
    }
  }

  if (isMedicineContext) {
    const Medicine = require('../models/Medicine');
    let query = { elderlyId, status: 'Active' };
    
    if (context && typeof context === 'string' && context.startsWith('medicine_')) {
      const specificMedId = context.replace('medicine_', '');
      query = { _id: specificMedId };
    } else {
      const activeMedsForCheck = await Medicine.find({ elderlyId, status: 'Active' });
      const mentionedMed = activeMedsForCheck.find(m => 
        rawTextTrimmed.toLowerCase().includes(m.medicineName.toLowerCase()) ||
        rawTextTrimmed.toLowerCase().replace(/\s+/g, '').includes(m.medicineName.toLowerCase().replace(/\s+/g, ''))
      );
      if (mentionedMed) {
        query = { _id: mentionedMed._id };
      }
    }
    
    const activeMeds = await Medicine.find(query);
    
    const lowerTrans = match.transcription.toLowerCase();
    const isTaken = (rawTextTrimmed === 'వేసుకున్నాను' || rawTextTrimmed === 'veskunnanu' || rawTextTrimmed === 'vesukuna' || rawTextTrimmed === 'veskuna' || rawTextTrimmed === 'veskunna' || rawTextTrimmed === 'వేసుకున్నా' || rawTextTrimmed === 'అవును' || rawTextTrimmed === 'avunu' || rawTextTrimmed === 'yes' || rawTextTrimmed === 'chesanu') ||
                    (lowerTrans.includes('yes') || lowerTrans.includes('took') || lowerTrans.includes('taken') || lowerTrans.includes('done') || lowerTrans.includes('completed'));
    const statusVal = isTaken ? 'taken' : 'missed';

    for (let med of activeMeds) {
      const existingIndex = med.history.findIndex(h => h.date === activeDate);
      if (existingIndex > -1) {
        med.history[existingIndex].status = statusVal;
        med.history[existingIndex].markedAt = new Date();
      } else {
        med.history.push({ date: activeDate, status: statusVal });
      }
      await med.save();
    }

    if (!isTaken) {
      const medNames = activeMeds.map(m => m.medicineName).join(', ');
      await Notification.create({
        userId: profile.createdBy,
        title: 'Medicine Missed Warning',
        message: `${profile.name} missed medicine schedule: ${medNames || 'Medicine'}. Answered: "${rawText}"`,
        type: 'Medicine Missed'
      });
    }

    match.transcription = isTaken ? 'Yes (taken medicine)' : 'No (missed medicine)';
    match.intent = 'Medicine Confirmation';
    match.riskLevel = 'Low';
  }
  else if (isMealContext) {
    const Meal = require('../models/Meal');
    const lowerTrans = match.transcription.toLowerCase();
    const isCompleted = (rawTextTrimmed === 'అవును' || rawTextTrimmed === 'avunu' || rawTextTrimmed === 'yes' || rawTextTrimmed === 'chesanu' || rawTextTrimmed === 'tinnanu') ||
                        (lowerTrans.includes('yes') || lowerTrans.includes('ate') || lowerTrans.includes('took') || lowerTrans.includes('done') || lowerTrans.includes('completed') || lowerTrans.includes('tinnanu'));
    const mealStatus = isCompleted ? 'Completed' : 'Skipped';

    const updateData = {};
    updateData[mealTimeContext] = mealStatus;

    await Meal.findOneAndUpdate(
      { elderlyId, date: activeDate },
      updateData,
      { upsert: true, new: true }
    );

    match.transcription = isCompleted ? 'Yes (completed meal)' : 'No (skipped meal)';
    match.intent = isCompleted ? 'Meal Confirmed' : 'Meal Skipped';
    match.riskLevel = 'Low';

    if (!isCompleted) {
      const pastMeals = await Meal.find({ elderlyId }).sort({ date: -1 }).limit(7);
      let skippedCount = 0;
      pastMeals.forEach(m => {
        if (m.breakfast === 'Skipped') skippedCount++;
        if (m.lunch === 'Skipped') skippedCount++;
        if (m.dinner === 'Skipped') skippedCount++;
      });

      if (skippedCount >= 2) {
        await EmergencyAlert.create({
          elderlyId,
          alertType: 'Emergency',
          severity: 'Medium',
          description: `Possible Health Concern: ${profile.name} skipped meals multiple times.`
        });

        await Notification.create({
          userId: profile.createdBy,
          title: 'Possible Health Concern',
          message: `${profile.name} skipped meals multiple times.`,
          type: 'Health Concern'
        });
      }
    }
  }

  // Log voice response
  const voiceResponse = await VoiceResponse.create({
    elderlyId,
    transcription: `${rawText} (${match.transcription})`,
    intent: match.intent,
    riskLevel: match.riskLevel,
    audioFile: audioFileName || 'simulated_audio_clip.wav',
    createdAt: activeDate === new Date().toISOString().split('T')[0] ? new Date() : new Date(activeDate + 'T12:00:00')
  });

  // Automatic emergency alerts
  if (!alertCreated && (match.riskLevel === 'High' || match.riskLevel === 'Critical' || ['Chest Pain', 'Dizziness', 'Help', 'Breathing Problem', 'Fall'].includes(match.alertType))) {
    const severity = (match.riskLevel === 'Low' || !match.riskLevel) ? 'High' : match.riskLevel;
    const alertType = match.alertType || 'Emergency';

    await EmergencyAlert.create({
      elderlyId,
      alertType,
      severity,
      description: `Emergency detected via voice command: "${rawText}". Decoded intent: ${match.intent}.`
    });

    await Notification.create({
      userId: profile.createdBy,
      title: `Emergency: ${alertType} Detected`,
      message: `Voice emergency triggered for ${profile.name}: "${rawText}" (Risk: ${severity}).`,
      type: 'Emergency Detected'
    });
  }

  return {
    voiceResponse,
    alertTriggered: match.riskLevel !== 'Low'
  };
};

// @desc    Simulate and log voice responses
// @route   POST /api/voice/simulate
// @access  Private
router.post('/simulate', protect, async (req, res) => {
  try {
    const { elderlyId, rawText, language, context, date } = req.body;

    if (!elderlyId || !rawText) {
      return res.status(400).json({ success: false, message: 'Please provide elderlyId and rawText' });
    }

    const result = await processVoiceResponse({
      elderlyId,
      rawText,
      language,
      context,
      date,
      audioFileName: 'simulated_audio_clip.wav'
    });

    res.status(201).json({
      success: true,
      data: result.voiceResponse,
      alertTriggered: result.alertTriggered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Upload raw voice recording and parse intent
// @route   POST /api/voice/upload
// @access  Private
router.post('/upload', protect, async (req, res) => {
  try {
    const { elderlyId, rawText, language, context, audio, date } = req.body;

    if (!elderlyId || !rawText || !audio) {
      return res.status(400).json({ success: false, message: 'Please provide elderlyId, rawText and audio payload' });
    }

    // Ensure uploads/voice folder exists
    const voiceDir = path.join(__dirname, '../uploads/voice');
    if (!fs.existsSync(voiceDir)) {
      fs.mkdirSync(voiceDir, { recursive: true });
    }

    // Generate filename and write Base64 data to disk
    const timestamp = Date.now();
    const audioFileName = `voice_${elderlyId}_${timestamp}.wav`;
    const filePath = path.join(voiceDir, audioFileName);

    const base64Data = audio.replace(/^data:.*;base64,/, "");
    fs.writeFileSync(filePath, base64Data, 'base64');

    const result = await processVoiceResponse({
      elderlyId,
      rawText,
      language,
      context,
      date,
      audioFileName: `uploads/voice/${audioFileName}`
    });

    res.status(201).json({
      success: true,
      data: result.voiceResponse,
      alertTriggered: result.alertTriggered
    });
  } catch (error) {
    console.error('Audio check-in upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all voice responses for a profile
// @route   GET /api/voice/elderly/:elderlyId
// @access  Private
router.get('/elderly/:elderlyId', protect, async (req, res) => {
  try {
    const responses = await VoiceResponse.find({ elderlyId: req.params.elderlyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: responses.length, data: responses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Simulate Missed Contact (48 Hours)
// @route   POST /api/voice/simulate-missed
// @access  Private
router.post('/simulate-missed', protect, async (req, res) => {
  try {
    const { elderlyId } = req.body;
    if (!elderlyId) {
      return res.status(400).json({ success: false, message: 'Please provide elderlyId' });
    }

    const WellnessCheck = require('../models/WellnessCheck');
    const MoodLog = require('../models/MoodLog');
    const Meal = require('../models/Meal');

    const today = new Date();
    const dateStrToday = today.toISOString().split('T')[0];
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStrYesterday = yesterday.toISOString().split('T')[0];

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000 - 60000); // 48h + 1min ago
    const dateStrTwoDaysAgo = twoDaysAgo.toISOString().split('T')[0];

    await WellnessCheck.deleteMany({ elderlyId, date: { $in: [dateStrToday, dateStrYesterday] } });
    await MoodLog.deleteMany({ elderlyId, date: { $in: [dateStrToday, dateStrYesterday] } });
    await Meal.deleteMany({ elderlyId, date: { $in: [dateStrToday, dateStrYesterday] } });

    await WellnessCheck.findOneAndUpdate(
      { elderlyId, date: dateStrTwoDaysAgo },
      { 
        response: 'Daily Wellness Check Received: బాగున్నాను.', 
        healthStatus: 'Good', 
        remarks: 'Simulated past log',
        createdAt: twoDaysAgo
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Simulated 48 hours of silence successfully. Reload dashboard to see warnings.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
