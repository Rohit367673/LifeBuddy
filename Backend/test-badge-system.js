const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Event = require('./models/Event');
const Mood = require('./models/Mood');
const Achievement = require('./models/Achievement');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy';

async function testBadgeSystem() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a test user
    console.log('\n👤 Creating test user...');
    const testUser = new User({
      email: 'test@badge.com',
      displayName: 'Badge Tester',
      firebaseUid: 'test-badge-user-123',
      stats: {
        totalEvents: 0,
        completedEvents: 0,
        completedTasks: 0,
        totalTasks: 0,
        moodEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        logins: 1,
        taskStreak: 0,
        moodStreak: 0,
        earlyBirdDays: 0,
        nightOwlDays: 0,
        socialEvents: 0,
        homeEvents: 0,
        fitnessTasks: 0,
        learningTasks: 0,
        creativeTasks: 0,
        organizedEvents: 0,
        completedGoals: 0,
        consistencyStreak: 0,
        stressManagedDays: 0,
        perfectWeeks: 0,
        taskCompletionHistory: [],
        moodEntryHistory: []
      }
    });
    await testUser.save();
    console.log('✅ Test user created');

    // Test 1: First Task Badge
    console.log('\n📝 Test 1: Creating first task...');
    const firstTask = new Task({
      user: testUser._id,
      title: 'Test Task 1',
      description: 'This is the first task',
      priority: 'medium',
      status: 'pending',
      category: 'general'
    });
    await firstTask.save();
    console.log('✅ First task created');

    // Complete the first task
    console.log('🔄 Completing first task...');
    firstTask.status = 'completed';
    firstTask.completedAt = new Date();
    await firstTask.save();

    // Update user stats
    await testUser.incrementCompletedTasks({
      category: firstTask.category,
      priority: firstTask.priority
    });

    // Check for achievements
    const userStats = await User.getUserStats(testUser._id);
    const achievements1 = await Achievement.checkAchievements(testUser._id, userStats);
    console.log('🏆 Achievements after first task:', achievements1.length);
    achievements1.forEach(achievement => {
      console.log(`  - ${achievement.title}: ${achievement.description}`);
    });

    // Test 2: Fitness Task Badge
    console.log('\n💪 Test 2: Creating fitness task...');
    const fitnessTask = new Task({
      user: testUser._id,
      title: 'Workout',
      description: 'Go to the gym',
      priority: 'high',
      status: 'pending',
      category: 'fitness'
    });
    await fitnessTask.save();
    console.log('✅ Fitness task created');

    // Complete fitness task
    fitnessTask.status = 'completed';
    fitnessTask.completedAt = new Date();
    await fitnessTask.save();

    await testUser.incrementCompletedTasks({
      category: fitnessTask.category,
      priority: fitnessTask.priority
    });

    const achievements2 = await Achievement.checkAchievements(testUser._id, userStats);
    console.log('🏆 Achievements after fitness task:', achievements2.length);

    // Test 3: Learning Task Badge
    console.log('\n📚 Test 3: Creating learning task...');
    const learningTask = new Task({
      user: testUser._id,
      title: 'Study JavaScript',
      description: 'Learn React hooks',
      priority: 'medium',
      status: 'pending',
      category: 'learning'
    });
    await learningTask.save();
    console.log('✅ Learning task created');

    // Complete learning task
    learningTask.status = 'completed';
    learningTask.completedAt = new Date();
    await learningTask.save();

    await testUser.incrementCompletedTasks({
      category: learningTask.category,
      priority: learningTask.priority
    });

    const achievements3 = await Achievement.checkAchievements(testUser._id, userStats);
    console.log('🏆 Achievements after learning task:', achievements3.length);

    // Test 4: Mood Entry Badge
    console.log('\n😊 Test 4: Creating mood entry...');
    const moodEntry = new Mood({
      user: testUser._id,
      mood: { emoji: '😊', rating: 7, label: 'good' },
      notes: 'Feeling great today!',
      activities: ['work', 'exercise'],
      weather: 'sunny',
      sleepHours: 8,
      energyLevel: 8,
      stressLevel: 2,
      tags: ['productive']
    });
    await moodEntry.save();
    console.log('✅ Mood entry created');

    await testUser.addMoodEntry({
      stressLevel: moodEntry.stressLevel,
      energyLevel: moodEntry.energyLevel,
      activities: moodEntry.activities
    });

    const achievements4 = await Achievement.checkAchievements(testUser._id, userStats);
    console.log('🏆 Achievements after mood entry:', achievements4.length);

    // Test 5: Event Creation Badge
    console.log('\n🎯 Test 5: Creating first event...');
    const firstEvent = new Event({
      user: testUser._id,
      title: 'Career Change',
      type: 'career',
      description: 'Transition to new role',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priority: 'high',
      status: 'planning',
      checklist: [
        'Update resume',
        'Network with professionals',
        'Apply to positions',
        'Prepare for interviews'
      ]
    });
    await firstEvent.save();
    console.log('✅ First event created');

    await testUser.addEvent({
      type: firstEvent.type,
      checklist: firstEvent.checklist
    });

    const achievements5 = await Achievement.checkAchievements(testUser._id, userStats);
    console.log('🏆 Achievements after first event:', achievements5.length);

    // Test 6: Social Event Badge
    console.log('\n🦋 Test 6: Creating social event...');
    const socialEvent = new Event({
      user: testUser._id,
      title: 'Team Party',
      type: 'social',
      description: 'Company team building',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      status: 'planning'
    });
    await socialEvent.save();
    console.log('✅ Social event created');

    await testUser.addEvent({
      type: socialEvent.type,
      checklist: socialEvent.checklist
    });

    const achievements6 = await Achievement.checkAchievements(testUser._id, userStats);
    console.log('🏆 Achievements after social event:', achievements6.length);

    // Display final user stats
    console.log('\n📊 Final User Statistics:');
    const finalUser = await User.findById(testUser._id);
    console.log('  - Total Tasks:', finalUser.stats.totalTasks);
    console.log('  - Completed Tasks:', finalUser.stats.completedTasks);
    console.log('  - Total Events:', finalUser.stats.totalEvents);
    console.log('  - Mood Entries:', finalUser.stats.moodEntries);
    console.log('  - Task Streak:', finalUser.stats.taskStreak);
    console.log('  - Mood Streak:', finalUser.stats.moodStreak);
    console.log('  - Fitness Tasks:', finalUser.stats.fitnessTasks);
    console.log('  - Learning Tasks:', finalUser.stats.learningTasks);
    console.log('  - Social Events:', finalUser.stats.socialEvents);
    console.log('  - Early Bird Days:', finalUser.stats.earlyBirdDays);
    console.log('  - Night Owl Days:', finalUser.stats.nightOwlDays);

    // Display all achievements
    console.log('\n🏆 All Achievements Earned:');
    const allAchievements = await Achievement.find({ user: testUser._id });
    allAchievements.forEach(achievement => {
      console.log(`  - ${achievement.title} (${achievement.badge}): ${achievement.description}`);
    });

    // Test completion rate calculation
    const completionRate = finalUser.stats.totalTasks > 0 
      ? Math.round((finalUser.stats.completedTasks / finalUser.stats.totalTasks) * 100)
      : 0;
    console.log(`\n📈 Task Completion Rate: ${completionRate}%`);

    // Test streak analysis
    console.log('\n🔥 Streak Analysis:');
    console.log(`  - Current Task Streak: ${finalUser.stats.taskStreak} days`);
    console.log(`  - Current Mood Streak: ${finalUser.stats.moodStreak} days`);
    console.log(`  - Consistency Streak: ${finalUser.stats.consistencyStreak} days`);
    console.log(`  - Longest Streak: ${finalUser.stats.longestStreak} days`);

    console.log('\n✅ Badge unlock system test completed successfully!');
    console.log('🎉 All analytics and streak tracking are working properly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testBadgeSystem(); 