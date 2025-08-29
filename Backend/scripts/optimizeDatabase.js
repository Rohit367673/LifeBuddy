const mongoose = require('mongoose');
require('dotenv').config();

// Database optimization script
async function optimizeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create indexes for better query performance
    console.log('Creating/updating indexes...');

    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ 'subscription.status': 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    await db.collection('users').createIndex({ 'stats.taskStreak': -1 });

    // Events collection indexes
    await db.collection('events').createIndex({ userId: 1, date: -1 });
    await db.collection('events').createIndex({ userId: 1, startTime: 1 });
    await db.collection('events').createIndex({ userId: 1, endTime: 1 });
    await db.collection('events').createIndex({ date: 1 });
    await db.collection('events').createIndex({ category: 1 });

    // Tasks collection indexes
    await db.collection('tasks').createIndex({ userId: 1, dueDate: 1 });
    await db.collection('tasks').createIndex({ userId: 1, status: 1 });
    await db.collection('tasks').createIndex({ userId: 1, priority: 1 });
    await db.collection('tasks').createIndex({ dueDate: 1 });

    // Mood collection indexes
    await db.collection('moods').createIndex({ userId: 1, date: -1 });
    await db.collection('moods').createIndex({ userId: 1, createdAt: -1 });

    // Chat messages indexes
    await db.collection('chatmessages').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('chatmessages').createIndex({ createdAt: -1 });

    // Payments indexes
    await db.collection('payments').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('payments').createIndex({ status: 1 });

    // Referral indexes
    await db.collection('referralcodes').createIndex({ code: 1 }, { unique: true });
    await db.collection('referralhits').createIndex({ code: 1, ip: 1, createdAt: 1 });

    // Achievement indexes
    await db.collection('achievements').createIndex({ userId: 1, type: 1 });
    await db.collection('achievements').createIndex({ userId: 1, createdAt: -1 });

    console.log('All indexes created successfully');

    // Analyze collection sizes
    console.log('\nCollection sizes:');
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        const stats = await db.collection(collection.name).stats();
        const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
        const count = stats.count;
        console.log(`${collection.name}: ${count} documents, ${sizeInMB} MB`);
      } catch (error) {
        console.log(`${collection.name}: Unable to get stats - ${error.message}`);
      }
    }

    // Database optimization recommendations
    console.log('\nOptimization recommendations:');
    console.log('1. Consider adding TTL indexes for temporary data');
    console.log('2. Monitor slow queries using MongoDB profiler');
    console.log('3. Use compound indexes for complex queries');
    console.log('4. Consider sharding for very large collections');

    await mongoose.disconnect();
    console.log('Database optimization completed');

  } catch (error) {
    console.error('Error optimizing database:', error);
    process.exit(1);
  }
}

// Run optimization if called directly
if (require.main === module) {
  optimizeDatabase();
}

module.exports = optimizeDatabase;
