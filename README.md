# LifeBuddy - Comprehensive Life Management Platform

LifeBuddy is a full-featured web application designed to help users manage life events, daily tasks, mood tracking, and personal growth through an intuitive interface with motivational features and achievement systems.

## 🌟 Features

### 🎯 Event Planner
- **Predefined Events**: Choose from common life events (moving, job change, wedding, college, travel, car purchase)
- **Custom Events**: Create personalized events with custom checklists and notes
- **Event Templates**: Each predefined event includes:
  - Comprehensive checklists
  - Budget calculators with estimated costs
  - Resource links and planning tools
  - Progress tracking
- **Event Management**: Full CRUD operations with status tracking and progress visualization

### 🛠️ Daily Tools
- **To-Do List**: 
  - Add, edit, and delete tasks
  - Set priorities (low, medium, high, urgent)
  - Due date management
  - Task categories and descriptions
  - Completion tracking
- **Mood Tracker**:
  - Daily mood logging with emoji selection
  - Mood rating scale (1-10)
  - Activity tracking (work, exercise, social, etc.)
  - Weather and sleep tracking
  - Energy and stress level monitoring
  - Mood history and trends
- **Calendar View**: Monthly view for tasks, events, and mood entries (coming soon)

### 📊 Dashboard
- **Overview Widgets**: 
  - Upcoming events summary
  - Daily task overview
  - Mood streak tracking
  - Achievement points
- **Motivational Messages**: Daily inspirational quotes
- **Recent Activity**: Quick access to recent events and tasks
- **Quick Actions**: Direct links to add events, tasks, and log mood

### 🏆 Achievement System
- **Gamification**: Earn points and badges for completing tasks and events
- **Achievement Categories**: 
  - Event completion badges
  - Task streak achievements
  - Mood tracking milestones
  - Productivity goals
- **Progress Tracking**: Visual progress bars for each achievement
- **Badge System**: Bronze, Silver, Gold, Platinum, Diamond levels

### 📈 Analytics
- **Comprehensive Insights**:
  - Event completion rates and types
  - Task performance metrics
  - Mood trends and patterns
  - Achievement progress
- **Time-based Analysis**: Filter data by time ranges (7 days, 30 days, 90 days, 1 year)
- **Visual Charts**: Progress bars and distribution charts
- **Productivity Metrics**: Completion rates, streaks, and trends

### ⚙️ Settings & Profile
- **Profile Management**: Update display name, first/last name
- **Notification Preferences**: Email, push, and reminder settings
- **Theme Settings**: Light, dark, and auto themes
- **Achievement Display**: View all earned and available achievements
- **Privacy & Security**: Account security information
- **About Section**: App information and support contact

### 🔐 Authentication & Security
- **Firebase Authentication**: Secure Google OAuth login
- **JWT Token Management**: Secure API communication
- **User Data Protection**: Encrypted data storage
- **Privacy Controls**: User-controlled data sharing

## 🚀 Technology Stack

### Frontend
- **React 18** with Vite for fast development
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Heroicons** for icons
- **Headless UI** for accessible components

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** for database
- **Mongoose** for ODM
- **JWT** for authentication
- **Express Rate Limiting** for API protection

### Authentication
- **Firebase Authentication** with Google OAuth
- **JWT tokens** for session management

## 📁 Project Structure

```
LifeBuddy/
├── Frontend/
│   └── lifebuddy/
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── context/        # React context providers
│       │   ├── pages/          # Main application pages
│       │   ├── styles/         # CSS and Tailwind config
│       │   └── utils/          # Utility functions
│       ├── public/             # Static assets
│       └── package.json        # Frontend dependencies
├── Backend/
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API endpoints
│   ├── middlewares/            # Express middlewares
│   ├── app.js                  # Main server file
│   └── package.json            # Backend dependencies
└── README.md                   # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account
- Firebase project

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=http://localhost:5173
   PORT=5001
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Frontend/lifebuddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Mood Tracking
- `GET /api/mood` - Get mood entries
- `POST /api/mood` - Log mood entry
- `PUT /api/mood/:id` - Update mood entry
- `GET /api/mood/stats/overview` - Get mood statistics

### Achievements
- `GET /api/achievements` - Get user achievements
- `GET /api/achievements/stats/overview` - Get achievement statistics
- `POST /api/achievements/check` - Check for new achievements

### Motivational Messages
- `GET /api/motivational/daily` - Get daily motivational message
- `GET /api/motivational/random` - Get random motivational message

## 🎨 UI/UX Features

### Design System
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Accessibility**: WCAG compliant components
- **Dark/Light Mode**: Theme switching capability

### User Experience
- **Intuitive Navigation**: Clear sidebar navigation with active states
- **Quick Actions**: Fast access to common tasks
- **Progress Visualization**: Visual progress bars and charts
- **Real-time Updates**: Live data updates without page refresh
- **Error Handling**: User-friendly error messages and loading states

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Cross-origin request protection
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all inputs
- **Data Encryption**: Sensitive data encryption in transit and at rest

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Deploy to platforms like:
   - Heroku
   - Railway
   - DigitalOcean App Platform
   - AWS Elastic Beanstalk

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy to platforms like:
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@lifebuddy.com

## 🎯 Roadmap

### Upcoming Features
- **Calendar Integration**: Full calendar view with drag-and-drop
- **Notification System**: Push notifications and email reminders
- **Data Export**: Export data to CSV/PDF
- **Mobile App**: React Native mobile application
- **Social Features**: Share achievements and events
- **Advanced Analytics**: Machine learning insights and predictions

### Future Enhancements
- **AI Assistant**: Smart suggestions and automation
- **Integration APIs**: Connect with external services
- **Team Features**: Collaborative event planning
- **Advanced Reporting**: Custom report generation
- **Multi-language Support**: Internationalization

---

**LifeBuddy** - Your comprehensive life management companion! 🚀 