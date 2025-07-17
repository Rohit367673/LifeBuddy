const mongoose = require('mongoose');
const admin = require('firebase-admin');
const User = require('../models/User');
const PremiumTask = require('../models/PremiumTask');
const serviceAccount = require('../path/to/your/firebase-service-account.json'); // <-- update path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifebuddy';

async function sendNotifications() {
  await mongoose.connect(MONGO_URI);

  // Find all users with an FCM token and an active premium task
  const users = await User.find({ fcmToken: { $exists: true, $ne: null } });

  for (const user of users) {
    const task = await PremiumTask.findOne({
      user: user._id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!task) continue;

    // Find today's subtask
    const today = new Date();
    const subtask = task.generatedSchedule.find(s =>
      new Date(s.date).toDateString() === today.toDateString()
    );

    let message;
    if (subtask && subtask.status === 'pending') {
      message = {
        notification: {
          title: "🧠 Today's Focus Task",
          body: subtask.subtask
        },
        token: user.fcmToken
      };
    } else {
      // If missed yesterday, send motivational message
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const ySubtask = task.generatedSchedule.find(s =>
        new Date(s.date).toDateString() === yesterday.toDateString()
      );
      if (ySubtask && ySubtask.status === 'pending') {
        message = {
          notification: {
            title: "Don't Give Up!",
            body: "You missed yesterday, but today is a fresh start! 💪 Let’s go again!"
          },
          token: user.fcmToken
        };
      }
    }

    if (message) {
      try {
        await admin.messaging().send(message);
        console.log(`Notification sent to user ${user.email}`);
      } catch (err) {
        console.error('FCM send error:', err);
      }
    }
  }

  await mongoose.disconnect();
}

sendNotifications(); 