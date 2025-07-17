const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Achievement = require('./models/Achievement');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifebuddy';

async function runTest() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Create a test user
  let user = await User.findOne({ email: 'test-achievement@example.com' });
  if (!user) {
    user = new User({
      email: 'test-achievement@example.com',
      displayName: 'Test User',
      password: 'test1234',
      firebaseUid: 'test-achievement-firebase-uid', // Ensure unique firebaseUid
    });
    await user.save();
    console.log('Created test user:', user._id);
  } else {
    console.log('Using existing test user:', user._id);
  }

  // Create a new task for the user
  const task = new Task({
    user: user._id,
    title: 'Test Task',
    status: 'pending',
  });
  await task.save();
  console.log('Created test task:', task._id);

  // Mark the task as completed
  task.status = 'completed';
  task.completedAt = new Date();
  await task.save();
  await user.incrementCompletedTasks();
  console.log('Marked task as completed and incremented user stats.');

  // Check for achievements
  const userStats = await User.getUserStats(user._id);
  console.log('User stats:', userStats);
  const newAchievements = await Achievement.checkAchievements(user._id, userStats);
  console.log('New achievements unlocked:', newAchievements);

  // List all achievements for the user
  const allAchievements = await Achievement.find({ user: user._id });
  console.log('All achievements for user:', allAchievements.map(a => a.type));

  await mongoose.disconnect();
}

runTest().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
}); 