const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function restoreAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy');
    console.log('✅ Connected to MongoDB');
    
    // Check if admin user exists
    let user = await User.findOne({ email: 'rohit367673@gmail.com' });
    
    if (user) {
      console.log('✅ Admin user found:', {
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        totalPoints: user.stats?.totalPoints || 0
      });
      
      // Update user stats if needed
      if (!user.stats || user.stats.totalPoints < 100) {
        user.stats = {
          ...user.stats,
          totalPoints: 1000,
          completedTasks: 50,
          totalTasks: 60,
          currentStreak: 7,
          longestStreak: 15,
          logins: 25,
          moodEntries: 10
        };
        await user.save();
        console.log('✅ Admin user stats updated');
      }
    } else {
      console.log('❌ Admin user not found - creating new admin user');
      user = new User({
        email: 'rohit367673@gmail.com',
        displayName: 'Rohit',
        username: 'rohit',
        firebaseUid: 'admin-rohit-uid-' + Date.now(),
        stats: {
          totalPoints: 1000,
          completedTasks: 50,
          totalTasks: 60,
          currentStreak: 7,
          longestStreak: 15,
          logins: 25,
          moodEntries: 10,
          totalEvents: 20,
          completedEvents: 18
        },
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            push: true,
            reminders: true
          }
        }
      });
      
      await user.save();
      console.log('✅ Admin user created successfully');
    }
    
    console.log('Final admin user data:', {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      username: user.username,
      totalPoints: user.stats?.totalPoints
    });
    
  } catch (error) {
    console.error('❌ Error restoring admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

restoreAdminUser();
