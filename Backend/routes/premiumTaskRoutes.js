const express = require('express');
const router = express.Router();
const PremiumTask = require('../models/PremiumTask');
const { authenticateUser } = require('../middlewares/authMiddleware');
const { checkPremiumFeature } = require('../middlewares/premiumMiddleware');
const User = require('../models/User');
const { MessagingService } = require('../services/messagingService');

// Use checkPremiumFeature('premiumMotivationalMessages') as requirePremium
const requirePremium = checkPremiumFeature('premiumMotivationalMessages');

// DeepSeek API integration function
async function generateDeepSeekSchedule(userPrompt, startDate, endDate) {
  try {
    const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepSeekApiKey) {
      console.log('DeepSeek API key not configured, using enhanced mock schedule');
      return generateEnhancedMockSchedule(userPrompt, startDate, endDate);
    }

    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) + 1;
    
    const prompt = `Create a detailed ${days}-day learning roadmap for: "${userPrompt}". 

    Requirements:
    - Break down into daily actionable tasks with specific learning objectives
    - Each day should have 1-3 specific subtasks with detailed explanations
    - Include practical exercises, code examples, and hands-on projects
    - Provide learning resources, documentation links, and reference materials
    - Include motivation tips and progress tracking suggestions
    - Make it progressive and achievable for a beginner to intermediate level
    - Consider the user's learning pace and provide clear next steps
    
    Format the response as a JSON array with this structure:
    [
      {
        "day": 1,
        "date": "YYYY-MM-DD",
        "subtask": "Detailed task description with specific learning objectives",
        "motivationTip": "Encouraging message with learning tips",
        "resources": ["Resource 1", "Resource 2"],
        "exercises": ["Exercise 1", "Exercise 2"],
        "notes": "Additional learning notes and tips"
      }
    ]`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepSeekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', response.status, errorData);
      console.log('Falling back to enhanced mock schedule due to API error');
      return generateEnhancedMockSchedule(userPrompt, startDate, endDate);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response from DeepSeek
    const scheduleData = JSON.parse(content);
    
    // Convert to our format
    return scheduleData.map((item, index) => ({
      date: new Date(new Date(startDate).getTime() + index * 24*60*60*1000),
      subtask: item.subtask,
      status: 'pending',
      motivationTip: item.motivationTip,
      resources: item.resources || [],
      exercises: item.exercises || [],
      notes: item.notes || '',
      day: item.day
    }));

  } catch (error) {
    console.error('DeepSeek API error:', error);
    console.log('Falling back to enhanced mock schedule due to error');
    // Fallback to enhanced mock schedule if DeepSeek fails
    return generateEnhancedMockSchedule(userPrompt, startDate, endDate);
  }
}

// Enhanced mock schedule generator with real learning content
function generateEnhancedMockSchedule(userPrompt, startDate, endDate) {
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) + 1;
  
  // Create detailed learning schedules based on common topics
  const detailedSchedules = {
    'next': {
      title: 'Next.js Mastery Roadmap',
      days: [
        {
          subtask: 'Set up Next.js development environment and create your first project. Learn about the App Router, file-based routing, and project structure. Build a simple homepage with navigation.',
          motivationTip: '🚀 Welcome to Next.js! Today you\'ll set up your development environment and create your first project. Remember, every expert was once a beginner.',
          resources: ['Next.js Documentation', 'Create Next.js App Guide', 'App Router Tutorial'],
          exercises: ['Create a new Next.js project', 'Build a simple homepage', 'Add navigation between pages'],
          notes: 'Focus on understanding the project structure and how file-based routing works. Practice creating and navigating between pages.'
        },
        {
          subtask: 'Master Next.js components, layouts, and styling. Learn about CSS Modules, Tailwind CSS integration, and responsive design. Build a component library for your project.',
          motivationTip: '💪 Great progress! Today you\'ll dive deep into components and styling. Building reusable components will make you a better developer.',
          resources: ['Next.js Components Guide', 'CSS Modules Documentation', 'Tailwind CSS Setup'],
          exercises: ['Create reusable components', 'Style your pages with CSS Modules', 'Build a responsive layout'],
          notes: 'Practice creating components that can be reused across your application. Focus on responsive design principles.'
        },
        {
          subtask: 'Implement dynamic routes, API routes, and data fetching. Learn about getStaticProps, getServerSideProps, and client-side data fetching. Build a blog with dynamic content.',
          motivationTip: '🔥 You\'re building real applications now! Dynamic routes and API routes are powerful features that will take your projects to the next level.',
          resources: ['Dynamic Routes Guide', 'API Routes Documentation', 'Data Fetching Patterns'],
          exercises: ['Create dynamic blog pages', 'Build API endpoints', 'Implement data fetching'],
          notes: 'Understand the difference between static and server-side rendering. Practice building API routes for your applications.'
        }
      ]
    },
    'nextjs': {
      title: 'Next.js Mastery Roadmap',
      days: [
        {
          subtask: 'Set up Next.js development environment and create your first project. Learn about the App Router, file-based routing, and project structure. Build a simple homepage with navigation.',
          motivationTip: '🚀 Welcome to Next.js! Today you\'ll set up your development environment and create your first project. Remember, every expert was once a beginner.',
          resources: ['Next.js Documentation', 'Create Next.js App Guide', 'App Router Tutorial'],
          exercises: ['Create a new Next.js project', 'Build a simple homepage', 'Add navigation between pages'],
          notes: 'Focus on understanding the project structure and how file-based routing works. Practice creating and navigating between pages.'
        },
        {
          subtask: 'Master Next.js components, layouts, and styling. Learn about CSS Modules, Tailwind CSS integration, and responsive design. Build a component library for your project.',
          motivationTip: '💪 Great progress! Today you\'ll dive deep into components and styling. Building reusable components will make you a better developer.',
          resources: ['Next.js Components Guide', 'CSS Modules Documentation', 'Tailwind CSS Setup'],
          exercises: ['Create reusable components', 'Style your pages with CSS Modules', 'Build a responsive layout'],
          notes: 'Practice creating components that can be reused across your application. Focus on responsive design principles.'
        },
        {
          subtask: 'Implement dynamic routes, API routes, and data fetching. Learn about getStaticProps, getServerSideProps, and client-side data fetching. Build a blog with dynamic content.',
          motivationTip: '🔥 You\'re building real applications now! Dynamic routes and API routes are powerful features that will take your projects to the next level.',
          resources: ['Dynamic Routes Guide', 'API Routes Documentation', 'Data Fetching Patterns'],
          exercises: ['Create dynamic blog pages', 'Build API endpoints', 'Implement data fetching'],
          notes: 'Understand the difference between static and server-side rendering. Practice building API routes for your applications.'
        }
      ]
    },
    'react': {
      title: 'React.js Fundamentals Roadmap',
      days: [
        {
          subtask: 'Set up React development environment and create your first component. Learn about JSX, props, and component structure. Build a simple counter component.',
          motivationTip: '🎯 Welcome to React! Today you\'ll create your first component and understand the basics of JSX and props.',
          resources: ['React Documentation', 'Create React App Guide', 'JSX Tutorial'],
          exercises: ['Create a new React project', 'Build a counter component', 'Pass props between components'],
          notes: 'Focus on understanding JSX syntax and how props work. Practice creating simple components.'
        },
        {
          subtask: 'Master React state management with useState and useEffect hooks. Learn about component lifecycle and side effects. Build a todo list application.',
          motivationTip: '⚡ State management is the heart of React! Today you\'ll learn how to manage component state and handle side effects.',
          resources: ['React Hooks Guide', 'useState Documentation', 'useEffect Tutorial'],
          exercises: ['Build a todo list app', 'Implement state management', 'Add and remove todo items'],
          notes: 'Practice using useState for local state and useEffect for side effects. Build a complete todo application.'
        },
        {
          subtask: 'Learn about React Router, context API, and advanced state management. Build a multi-page application with navigation and shared state.',
          motivationTip: '🌟 You\'re building complex applications now! Routing and context will help you create professional React apps.',
          resources: ['React Router Documentation', 'Context API Guide', 'Advanced State Management'],
          exercises: ['Add routing to your app', 'Implement context for state sharing', 'Build a multi-page application'],
          notes: 'Understand how to manage global state with context and implement client-side routing.'
        }
      ]
    },
    'javascript': {
      title: 'JavaScript Mastery Roadmap',
      days: [
        {
          subtask: 'Review JavaScript fundamentals: variables, functions, arrays, and objects. Practice ES6+ features like arrow functions, destructuring, and template literals.',
          motivationTip: '📚 JavaScript is the foundation of modern web development! Today you\'ll strengthen your core JavaScript skills.',
          resources: ['MDN JavaScript Guide', 'ES6+ Features', 'JavaScript Fundamentals'],
          exercises: ['Practice array methods', 'Write arrow functions', 'Use destructuring assignment'],
          notes: 'Focus on understanding modern JavaScript syntax and best practices. Practice with real examples.'
        },
        {
          subtask: 'Master asynchronous JavaScript with Promises, async/await, and fetch API. Learn about error handling and API integration.',
          motivationTip: '⚡ Asynchronous programming is crucial for modern web apps! Today you\'ll learn how to handle async operations properly.',
          resources: ['Async JavaScript Guide', 'Promise Documentation', 'Fetch API Tutorial'],
          exercises: ['Build a weather app', 'Handle API responses', 'Implement error handling'],
          notes: 'Practice working with APIs and handling asynchronous operations. Build real-world applications.'
        },
        {
          subtask: 'Learn advanced JavaScript concepts: closures, modules, and design patterns. Build a complete application using modern JavaScript.',
          motivationTip: '🎯 Advanced concepts will make you a better developer! Today you\'ll learn patterns used in professional applications.',
          resources: ['JavaScript Closures', 'ES6 Modules', 'Design Patterns'],
          exercises: ['Create a module system', 'Implement design patterns', 'Build a complete app'],
          notes: 'Understand how to structure large applications and use advanced JavaScript features effectively.'
        }
      ]
    }
  };

  // Try to match the prompt with known topics
  const promptLower = userPrompt.toLowerCase();
  let selectedSchedule = detailedSchedules.react; // default
  
  for (const [topic, schedule] of Object.entries(detailedSchedules)) {
    if (promptLower.includes(topic)) {
      selectedSchedule = schedule;
      break;
    }
  }

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(new Date(startDate).getTime() + i * 24*60*60*1000);
    const dayData = selectedSchedule.days[i] || {
      subtask: `Day ${i+1}: Continue learning ${userPrompt} with advanced concepts and practical exercises`,
      motivationTip: 'Keep pushing forward! Every day of practice brings you closer to mastery.',
      resources: ['Official Documentation', 'Community Forums', 'Video Tutorials'],
      exercises: [`Practice ${userPrompt} concepts`, 'Build a small project', 'Review and refactor code'],
      notes: 'Focus on practical application and real-world projects. Consistency is key to learning.'
    };
    
    return {
      date,
      subtask: dayData.subtask,
      status: 'pending',
      motivationTip: dayData.motivationTip,
      resources: dayData.resources,
      exercises: dayData.exercises,
      notes: dayData.notes,
      day: i + 1
    };
  });
}

// Send daily task notification via user's preferred platform
async function sendDailyTaskNotification(userId, task, dayNumber) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return;
    }

    const messagingService = new MessagingService();
    const result = await messagingService.sendMessage(user, task, dayNumber);
    
    if (result) {
      console.log(`Daily task notification sent to user ${user.email} via ${user.notificationPlatform} for day ${dayNumber}`);
    } else {
      console.log(`Failed to send notification to user ${user.email} for day ${dayNumber}`);
    }
  } catch (error) {
    console.error('Error sending daily task notification:', error);
  }
}

// Create a new premium task and trigger DeepSeek schedule generation
router.post('/setup', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      requirements, 
      startDate, 
      endDate, 
      consentGiven,
      notificationPlatform,
      contactInfo 
    } = req.body;
    
    if (!title || !startDate || !endDate || !consentGiven) {
      return res.status(400).json({ message: 'Missing required fields or consent.' });
    }

    // Update user's notification preferences
    if (notificationPlatform && contactInfo) {
      await User.findByIdAndUpdate(req.user._id, {
        notificationPlatform,
        ...(notificationPlatform === 'whatsapp' && { phoneNumber: contactInfo }),
        ...(notificationPlatform === 'telegram' && { telegramUsername: contactInfo }),
        ...(notificationPlatform === 'email' && { email: contactInfo })
      });
    }

    // Generate schedule using DeepSeek
    const schedule = await generateDeepSeekSchedule(title, startDate, endDate);

    // Save to DB
    const premiumTask = new PremiumTask({
      user: req.user._id,
      title,
      description,
      requirements,
      startDate,
      endDate,
      generatedSchedule: schedule,
      consentGiven: true,
      currentDay: 1 // Track current day
    });
    await premiumTask.save();

    // Send first day notification
    await sendDailyTaskNotification(req.user._id, premiumTask, 1);

    res.json({ 
      message: 'Premium task created with DeepSeek schedule!', 
      task: premiumTask,
      nextDay: 2,
      notificationPlatform
    });
  } catch (err) {
    console.error('Premium task setup error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Mark a subtask as complete or skipped and handle next day logic
router.post('/:id/mark', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status, dayNumber } = req.body;
    if (!date || !['completed', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid date or status.' });
    }

    const task = await PremiumTask.findOne({ _id: id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Find the subtask for the given date
    const subtask = task.generatedSchedule.find(s =>
      new Date(s.date).toDateString() === new Date(date).toDateString()
    );
    if (!subtask) return res.status(404).json({ message: 'Subtask not found for this date.' });

    // Only allow marking if still pending
    if (subtask.status !== 'pending') {
      return res.status(400).json({ message: 'Subtask already marked.' });
    }

    subtask.status = status;

    // Update stats and streaks
    if (status === 'completed') {
      task.stats.completed += 1;
      task.stats.currentStreak += 1;
      if (task.stats.currentStreak > task.stats.bestStreak) {
        task.stats.bestStreak = task.stats.currentStreak;
      }
      
      // Send next day notification if completed
      const nextDay = dayNumber + 1;
      const nextSubtask = task.generatedSchedule.find(s => s.day === nextDay);
      if (nextSubtask) {
        await sendDailyTaskNotification(req.user._id, task, nextDay);
        task.currentDay = nextDay;
      }
    } else if (status === 'skipped') {
      task.stats.skipped += 1;
      task.stats.currentStreak = 0; // streak broken
      
      // Regenerate schedule if skipped
      const newSchedule = await generateDeepSeekSchedule(
        task.title, 
        task.startDate, 
        task.endDate
      );
      task.generatedSchedule = newSchedule;
      task.currentDay = 1;
      
      // Send new first day notification
      await sendDailyTaskNotification(req.user._id, task, 1);
    }

    task.updatedAt = new Date();
    await task.save();

    res.json({ 
      message: 'Subtask updated.', 
      task,
      nextDay: status === 'completed' ? dayNumber + 1 : 1,
      rescheduled: status === 'skipped'
    });
  } catch (err) {
    console.error('Mark subtask error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get today's scheduled subtask and motivation tip
router.get('/today', authenticateUser, requirePremium, async (req, res) => {
  try {
    // Find the most recent active premium task for the user
    const task = await PremiumTask.findOne({
      user: req.user._id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!task) {
      return res.status(404).json({ message: 'No active premium task found for today.' });
    }

    // Find today's subtask based on current day
    const todaySubtask = task.generatedSchedule.find(s => s.day === task.currentDay);

    if (!todaySubtask) {
      return res.status(404).json({ message: 'No scheduled subtask for today.' });
    }

    res.json({
      taskId: task._id,
      title: task.title,
      description: task.description,
      subtask: todaySubtask.subtask,
      status: todaySubtask.status,
      motivationTip: todaySubtask.motivationTip,
      resources: todaySubtask.resources || [],
      exercises: todaySubtask.exercises || [],
      notes: todaySubtask.notes || '',
      dayNumber: task.currentDay,
      streak: task.stats.currentStreak,
      bestStreak: task.stats.bestStreak,
      completed: task.stats.completed,
      skipped: task.stats.skipped
    });
  } catch (err) {
    console.error("Fetch today's subtask error:", err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get weekly summary
router.get('/weekly-summary', authenticateUser, requirePremium, async (req, res) => {
  try {
    // Find the most recent active premium task for the user
    const task = await PremiumTask.findOne({
      user: req.user._id
    }).sort({ createdAt: -1 });

    if (!task) {
      return res.status(404).json({ message: 'No premium task found.' });
    }

    // Calculate the start of the current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    // Get all subtasks for this week
    const weekSubtasks = task.generatedSchedule.filter(s => {
      const d = new Date(s.date);
      return d >= monday && d <= today;
    });

    const completed = weekSubtasks.filter(s => s.status === 'completed').length;
    const skipped = weekSubtasks.filter(s => s.status === 'skipped').length;
    const pending = weekSubtasks.filter(s => s.status === 'pending').length;

    // For graph: array of { date, status }
    const dailyStatus = weekSubtasks.map(s => ({
      date: s.date,
      status: s.status
    }));

    res.json({
      taskId: task._id,
      title: task.title,
      week: {
        start: monday,
        end: today,
        completed,
        skipped,
        pending,
        dailyStatus
      },
      streak: task.stats.currentStreak,
      bestStreak: task.stats.bestStreak,
      totalCompleted: task.stats.completed,
      totalSkipped: task.stats.skipped
    });
  } catch (err) {
    console.error('Weekly summary error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Regenerate schedule with DeepSeek
router.post('/:id/regenerate', authenticateUser, requirePremium, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await PremiumTask.findOne({ _id: id, user: req.user._id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Regenerate schedule using DeepSeek
    const newSchedule = await generateDeepSeekSchedule(
      task.title, 
      task.startDate, 
      task.endDate
    );

    // Update task with new schedule
    task.generatedSchedule = newSchedule;
    task.currentDay = 1;
    task.updatedAt = new Date();
    await task.save();

    // Send new first day notification
    await sendDailyTaskNotification(req.user._id, task, 1);

    res.json({ 
      message: 'Schedule regenerated with DeepSeek!', 
      task,
      nextDay: 2
    });
  } catch (err) {
    console.error('Regenerate schedule error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete current active premium task for the user
router.delete('/current', authenticateUser, requirePremium, async (req, res) => {
  try {
    const task = await PremiumTask.findOneAndDelete({
      user: req.user._id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    if (!task) {
      return res.status(404).json({ message: 'No active premium task found.' });
    }
    res.json({ message: 'Current premium task deleted.' });
  } catch (err) {
    console.error('Delete current premium task error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Send a test FCM notification to the current user
router.post('/test-notification', authenticateUser, requirePremium, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.fcmToken) {
      return res.status(400).json({ message: 'No FCM token registered for this user.' });
    }
    const message = {
      notification: {
        title: 'DeepSeek Test Notification',
        body: 'This is a test push notification for your DeepSeek schedule.'
      },
      token: user.fcmToken
    };
    await admin.messaging().send(message);
    res.json({ message: 'Test notification sent!' });
  } catch (err) {
    console.error('Error sending test FCM notification:', err);
    res.status(500).json({ message: 'Failed to send test notification.' });
  }
});

module.exports = router;

// Export for testing
module.exports.generateMockSchedule = generateEnhancedMockSchedule;
module.exports.generateEnhancedMockSchedule = generateEnhancedMockSchedule; 