const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AI ElderCare Guardian API' });
});

// Import Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const medicineRoutes = require('./routes/medicines');
const wellnessRoutes = require('./routes/wellness');
const voiceRoutes = require('./routes/voice');
const emergencyRoutes = require('./routes/emergency');
const moodRoutes = require('./routes/moods');
const mealRoutes = require('./routes/meals');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const documentRoutes = require('./routes/documents');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Central Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
