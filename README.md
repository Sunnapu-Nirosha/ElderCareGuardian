# 🧓 AI ElderCare Guardian

**AI ElderCare Guardian** is a comprehensive, AI-powered web application designed to assist family members and guardians in monitoring, managing, and caring for elderly individuals remotely. 

By leveraging **Gemini AI** and **Voice Interaction**, the system proactively checks on the elderly, reminds them to take their medication, and automatically logs their responses without requiring them to navigate complex digital interfaces.

---

## ✨ Key Features

### 🎙️ AI Voice Interaction & Check-ins
* **Native Language Support:** The system uses Text-to-Speech to speak to the elderly in their native language (e.g., Telugu, English).
* **AI NLP Processing:** Uses Gemini AI to understand the senior's voice replies naturally (e.g., "Yes, I took it" or "No, I didn't").
* **Automated Logging:** Automatically marks medicines as "Taken" or "Missed" and updates the daily wellness calendar based strictly on the voice response.

### 💊 Intelligent Medicine Management
* **Digital Pillbox:** Schedule daily, weekly, or as-needed medications.
* **Auto-Reminders:** The system autonomously triggers voice reminders at scheduled times.
* **Prescription Storage:** Securely upload and store medical prescriptions and documents.

### 🚨 Emergency Center
* **Real-time Alerts:** Automatically catches distress calls (e.g., senior says "I have chest pain" or "I need help") and generates a critical alert.
* **Manual Simulation:** Guardians can simulate or manually log events (like a fall) to keep a secure incident log.
* **Rapid Resolution:** Color-coded severity banners alert guardians immediately upon opening the dashboard.

### ❤️ Wellness & Meal Monitoring
* **Daily Mood & Sleep Tracking:** Automated morning wellness check-ins to monitor long-term mental health.
* **Meal Logs:** Proactive tracking of Breakfast, Lunch, and Dinner with quick-action AI scenarios.

---

## 🛠️ Technology Stack

* **Frontend:** React.js, Vite, Bootstrap (Custom CSS for a premium UI)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Artificial Intelligence:** Google Gemini AI (for Natural Language Processing & Voice Intent Analysis)
* **APIs:** Web Speech API (Speech Synthesis & Recognition)

---

## ⚙️ How to Run the Project Locally

### 1. Clone the repository
```bash
git clone https://github.com/Sunnapu-Nirosha/ElderCareGuardian.git
cd ElderCareGuardian
```

### 2. Setup the Backend
```bash
cd backend
npm install
# Create a .env file and add your MONGODB_URI and GEMINI_API_KEY
npm run dev
```

### 3. Setup the Frontend
```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```

### 4. Access the Application
Open your browser and navigate to `http://localhost:5173`.

---

> **Note to Interviewers:** This project demonstrates a complete MVP flow. The voice interaction scenarios currently feature a Fast-Clock Simulator to easily demonstrate scheduled AI voice triggers and response handling during a live presentation.
