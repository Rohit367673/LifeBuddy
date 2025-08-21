/*
  Revoke trial/premium for a specific user by email.
  Usage:
    node scripts/revokeTrialForUser.js <email> [--resetTasks]

  Behavior:
    - Sets subscription.plan = 'free', subscription.status = 'active'
    - Clears subscription.trialEndDate and subscription.endDate
    - Disables all premium features
    - If --resetTasks is provided, resets trialTasks progress to zero/false
*/

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const emailArg = process.argv[2] || process.env.TARGET_EMAIL;
  const resetTasks = process.argv.includes('--resetTasks') || process.env.RESET_TASKS === '1';

  if (!emailArg) {
    console.error('Usage: node scripts/revokeTrialForUser.js <email> [--resetTasks]');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy';
  await mongoose.connect(mongoUri);

  try {
    const user = await User.findOne({ email: emailArg.toLowerCase().trim() });
    if (!user) {
      console.error('User not found for email:', emailArg);
      process.exitCode = 1;
      return;
    }

    const before = {
      plan: user.subscription?.plan,
      status: user.subscription?.status,
      trialEndDate: user.subscription?.trialEndDate,
      features: user.features,
      trialTasks: user.trialTasks
    };

    // Reset subscription to free/active
    user.subscription.plan = 'free';
    user.subscription.status = 'active';
    user.subscription.endDate = undefined;
    user.subscription.trialEndDate = undefined;
    user.subscription.stripeCustomerId = undefined;
    user.subscription.stripeSubscriptionId = undefined;

    // Disable all premium features explicitly
    user.features = {
      unlimitedEvents: false,
      advancedBudgetTracking: false,
      fullMoodHistory: false,
      customChecklists: false,
      premiumMotivationalMessages: false,
      profileInsights: false,
      fullCalendarSync: false,
      adFree: false,
      exportablePDFs: false,
      aiInsights: false,
      prioritySupport: false,
      advancedAnalytics: false,
    };

    if (resetTasks) {
      user.trialTasks = {
        watchedAd: false,
        followedInstagram: false,
        sharedReferrals: 0,
        lastUpdated: new Date(),
      };
    }

    await user.save();

    const after = {
      plan: user.subscription?.plan,
      status: user.subscription?.status,
      trialEndDate: user.subscription?.trialEndDate,
      features: user.features,
      trialTasks: user.trialTasks
    };

    console.log('Successfully revoked trial/premium for:', user.email);
    console.log('Before:', JSON.stringify(before, null, 2));
    console.log('After :', JSON.stringify(after, null, 2));
  } catch (err) {
    console.error('Error revoking trial:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
