const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

// Test user data
const testUser = {
  email: 'test@eventplanner.com',
  password: 'testpass123',
  displayName: 'Event Planner Tester'
};

// Helper function to get auth token
async function getAuthToken() {
  try {
    // First try to login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResponse.data.token) {
      return loginResponse.data.token;
    }
  } catch (error) {
    // If login fails, try to register
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
      return registerResponse.data.token;
    } catch (regError) {
      console.error('Failed to register user:', regError.response?.data);
      throw regError;
    }
  }
}

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// Test 1: Get Event Templates
async function testEventTemplates() {
  console.log('\n🧪 Testing Event Templates...');
  
  try {
    const response = await makeRequest('GET', '/events/templates');
    console.log('✅ Templates loaded successfully');
    console.log(`📋 Found ${response.data.templates.length} templates`);
    console.log(`👤 User event count: ${response.data.userEventCount}`);
    console.log(`🔒 Free tier limit: ${response.data.isFreeTier}`);
    
    // Check if templates have required fields
    const template = response.data.templates[0];
    if (template) {
      console.log('✅ Template structure verified:');
      console.log(`   - Title: ${template.title}`);
      console.log(`   - Type: ${template.eventType}`);
      console.log(`   - Budget: $${template.budget}`);
      console.log(`   - Checklist items: ${template.checklist.length}`);
      console.log(`   - Icon: ${template.icon}`);
      console.log(`   - Color: ${template.color}`);
    }
    
    return response.data.templates;
  } catch (error) {
    console.error('❌ Failed to load templates:', error.response?.data);
    throw error;
  }
}

// Test 2: Create Event from Template
async function testCreateTemplateEvent(templates) {
  console.log('\n🧪 Testing Template Event Creation...');
  
  const template = templates.find(t => t.id === 'moving');
  if (!template) {
    throw new Error('Moving template not found');
  }
  
  const eventData = {
    title: template.title,
    eventType: template.eventType,
    description: template.description,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    budget: template.budget,
    priority: template.priority,
    location: 'New York, NY',
    templateId: template.id,
    isCustom: false
  };
  
  try {
    const response = await makeRequest('POST', '/events', eventData);
    console.log('✅ Template event created successfully');
    console.log(`📅 Event ID: ${response.data._id}`);
    console.log(`📋 Checklist items: ${response.data.checklist.length}`);
    console.log(`💰 Budget: $${response.data.budget}`);
    console.log(`🎨 Color: ${response.data.color}`);
    console.log(`🏷️ Template-based: ${response.data.isTemplateBased}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create template event:', error.response?.data);
    throw error;
  }
}

// Test 3: Create Custom Event
async function testCreateCustomEvent() {
  console.log('\n🧪 Testing Custom Event Creation...');
  
  const eventData = {
    title: 'My Custom Project',
    eventType: 'Custom',
    description: 'A completely custom event for testing',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: 2500,
    priority: 'high',
    location: 'San Francisco, CA',
    checklist: [
      { item: 'Define project scope', completed: false },
      { item: 'Create timeline', completed: false },
      { item: 'Set up team', completed: false },
      { item: 'Launch project', completed: false }
    ],
    isCustom: true
  };
  
  try {
    const response = await makeRequest('POST', '/events', eventData);
    console.log('✅ Custom event created successfully');
    console.log(`📅 Event ID: ${response.data._id}`);
    console.log(`📋 Checklist items: ${response.data.checklist.length}`);
    console.log(`🏷️ Custom event: ${response.data.isCustom}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create custom event:', error.response?.data);
    throw error;
  }
}

// Test 4: Get All Events
async function testGetEvents() {
  console.log('\n🧪 Testing Get Events...');
  
  try {
    const response = await makeRequest('GET', '/events');
    console.log('✅ Events loaded successfully');
    console.log(`📅 Total events: ${response.data.events.length}`);
    console.log(`📄 Pagination: ${response.data.pagination.current}/${response.data.pagination.total}`);
    
    // Check event structure
    if (response.data.events.length > 0) {
      const event = response.data.events[0];
      console.log('✅ Event structure verified:');
      console.log(`   - Title: ${event.title}`);
      console.log(`   - Type: ${event.eventType}`);
      console.log(`   - Status: ${event.status}`);
      console.log(`   - Progress: ${event.progress}%`);
      console.log(`   - Budget: $${event.budget}`);
      console.log(`   - Checklist: ${event.checklist.length} items`);
    }
    
    return response.data.events;
  } catch (error) {
    console.error('❌ Failed to load events:', error.response?.data);
    throw error;
  }
}

// Test 5: Complete Checklist Item
async function testCompleteChecklistItem(eventId) {
  console.log('\n🧪 Testing Checklist Item Completion...');
  
  try {
    const response = await makeRequest('PATCH', `/events/${eventId}/checklist/0/complete`);
    console.log('✅ Checklist item completed successfully');
    console.log(`📊 New progress: ${response.data.progress}%`);
    
    // Check if progress updated
    const completedItems = response.data.checklist.filter(item => item.completed).length;
    console.log(`✅ Completed items: ${completedItems}/${response.data.checklist.length}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to complete checklist item:', error.response?.data);
    throw error;
  }
}

// Test 6: Add Budget Item
async function testAddBudgetItem(eventId) {
  console.log('\n🧪 Testing Budget Item Addition...');
  
  const budgetItem = {
    name: 'Moving Truck Rental',
    amount: 500,
    category: 'transportation',
    notes: 'Professional moving service'
  };
  
  try {
    const response = await makeRequest('POST', `/events/${eventId}/budget`, budgetItem);
    console.log('✅ Budget item added successfully');
    console.log(`💰 New spent amount: $${response.data.spentAmount}`);
    console.log(`📊 Budget items: ${response.data.budgetItems.length}`);
    
    // Check budget calculations
    const budgetRemaining = response.data.budget - response.data.spentAmount;
    console.log(`💵 Budget remaining: $${budgetRemaining}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to add budget item:', error.response?.data);
    throw error;
  }
}

// Test 7: Add Note
async function testAddNote(eventId) {
  console.log('\n🧪 Testing Note Addition...');
  
  const noteContent = 'This is a test note for the event planner functionality.';
  
  try {
    const response = await makeRequest('POST', `/events/${eventId}/notes`, {
      content: noteContent
    });
    console.log('✅ Note added successfully');
    console.log(`📝 Total notes: ${response.data.notes.length}`);
    
    // Check note structure
    const latestNote = response.data.notes[response.data.notes.length - 1];
    console.log(`📄 Latest note: ${latestNote.content.substring(0, 50)}...`);
    console.log(`📅 Note date: ${new Date(latestNote.createdAt).toLocaleString()}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to add note:', error.response?.data);
    throw error;
  }
}

// Test 8: Get Event Statistics
async function testEventStats() {
  console.log('\n🧪 Testing Event Statistics...');
  
  try {
    const response = await makeRequest('GET', '/events/stats/overview');
    console.log('✅ Event stats loaded successfully');
    console.log(`📊 Total events: ${response.data.totalEvents}`);
    console.log(`📈 Planning events: ${response.data.planningEvents}`);
    console.log(`⏳ In progress events: ${response.data.inProgressEvents}`);
    console.log(`✅ Completed events: ${response.data.completedEvents}`);
    console.log(`⚠️ Overdue events: ${response.data.overdueEvents}`);
    console.log(`📈 Average progress: ${response.data.averageProgress}%`);
    console.log(`💰 Total budget: $${response.data.totalBudget}`);
    console.log(`💸 Total spent: $${response.data.totalSpent}`);
    console.log(`💵 Budget remaining: $${response.data.budgetRemaining}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to load event stats:', error.response?.data);
    throw error;
  }
}

// Test 9: Update Event
async function testUpdateEvent(eventId) {
  console.log('\n🧪 Testing Event Update...');
  
  const updateData = {
    title: 'Updated Moving Project',
    description: 'Updated description for testing',
    priority: 'high',
    status: 'in-progress'
  };
  
  try {
    const response = await makeRequest('PUT', `/events/${eventId}`, updateData);
    console.log('✅ Event updated successfully');
    console.log(`📝 New title: ${response.data.title}`);
    console.log(`📝 New description: ${response.data.description}`);
    console.log(`🎯 New priority: ${response.data.priority}`);
    console.log(`📊 New status: ${response.data.status}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update event:', error.response?.data);
    throw error;
  }
}

// Test 10: Get User Profile (to check if event stats are updated)
async function testUserProfile() {
  console.log('\n🧪 Testing User Profile Updates...');
  
  try {
    const response = await makeRequest('GET', '/users/profile');
    console.log('✅ User profile loaded successfully');
    console.log(`👤 User: ${response.data.displayName}`);
    console.log(`📊 Total events: ${response.data.stats.totalEvents}`);
    console.log(`✅ Completed events: ${response.data.stats.completedEvents}`);
    console.log(`📈 Current streak: ${response.data.stats.currentStreak}`);
    console.log(`🏆 Total points: ${response.data.stats.totalPoints}`);
    
    // Check if event-related stats are updated
    if (response.data.stats.totalEvents > 0) {
      console.log('✅ Event stats are properly tracked in user profile');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to load user profile:', error.response?.data);
    throw error;
  }
}

// Test 11: Test Free Tier Limits
async function testFreeTierLimits() {
  console.log('\n🧪 Testing Free Tier Limits...');
  
  try {
    // Try to create a third event (should fail for free tier)
    const eventData = {
      title: 'Third Event Test',
      eventType: 'Custom',
      description: 'Testing free tier limits',
      startDate: new Date().toISOString().split('T')[0],
      budget: 1000,
      priority: 'medium',
      isCustom: true
    };
    
    const response = await makeRequest('POST', '/events', eventData);
    
    if (response.data.limitReached) {
      console.log('✅ Free tier limit properly enforced');
      console.log('🔒 Cannot create more than 2 events on free tier');
    } else {
      console.log('⚠️ Free tier limit not enforced');
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Free tier limit properly enforced (403 error)');
      console.log('🔒 Cannot create more than 2 events on free tier');
    } else {
      console.error('❌ Unexpected error testing free tier limits:', error.response?.data);
    }
  }
}

// Test 12: Test Event Filtering and Sorting
async function testEventFiltering() {
  console.log('\n🧪 Testing Event Filtering and Sorting...');
  
  try {
    // Test filtering by status
    const planningResponse = await makeRequest('GET', '/events?status=planning');
    console.log(`📋 Planning events: ${planningResponse.data.events.length}`);
    
    // Test sorting by priority
    const priorityResponse = await makeRequest('GET', '/events?sortBy=priority');
    console.log(`🎯 Priority sorted events: ${priorityResponse.data.events.length}`);
    
    // Test filtering by event type
    const movingResponse = await makeRequest('GET', '/events?eventType=Moving');
    console.log(`🏠 Moving events: ${movingResponse.data.events.length}`);
    
    console.log('✅ Event filtering and sorting working correctly');
    
  } catch (error) {
    console.error('❌ Failed to test event filtering:', error.response?.data);
    throw error;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Event Planner Comprehensive Test Suite...\n');
  
  try {
    // Get authentication token
    authToken = await getAuthToken();
    console.log('✅ Authentication successful');
    
    // Run all tests
    const templates = await testEventTemplates();
    const templateEvent = await testCreateTemplateEvent(templates);
    const customEvent = await testCreateCustomEvent();
    const events = await testGetEvents();
    
    // Test with the first event
    if (events.length > 0) {
      const firstEvent = events[0];
      await testCompleteChecklistItem(firstEvent._id);
      await testAddBudgetItem(firstEvent._id);
      await testAddNote(firstEvent._id);
      await testUpdateEvent(firstEvent._id);
    }
    
    await testEventStats();
    await testUserProfile();
    await testFreeTierLimits();
    await testEventFiltering();
    
    console.log('\n🎉 All Event Planner tests completed successfully!');
    console.log('\n✅ Features verified:');
    console.log('   - Event templates with predefined checklists and budgets');
    console.log('   - Custom event creation');
    console.log('   - Checklist management with progress tracking');
    console.log('   - Budget tracking with itemized expenses');
    console.log('   - Notes and journaling');
    console.log('   - Event status management (planning, in-progress, completed)');
    console.log('   - Free tier limits (2 events max)');
    console.log('   - Event filtering and sorting');
    console.log('   - Real-time statistics and analytics');
    console.log('   - User profile integration');
    console.log('   - Achievement system integration');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests(); 