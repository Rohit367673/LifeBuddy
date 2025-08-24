# LifeBuddy Backend

A Node.js/Express backend for the LifeBuddy life management application.

## Features

- **User Authentication**: Firebase Auth integration with JWT tokens
- **Event Management**: Create and manage life events (moving, job changes, etc.)
- **Task Management**: Organize tasks within events with priorities and due dates
- **User Profiles**: Manage user preferences and statistics
- **Dashboard Analytics**: Track progress and productivity
- **Security**: Rate limiting, CORS, and input validation
- **AI Model**: OpenRouter (configurable primary model with fallback and branded system prompts) for schedule, reminders, and motivational message generation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Auth + JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Built-in validation with error handling

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Firebase project (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/lifebuddy
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   OPENROUTER_API_KEY=your-openrouter-api-key-here
   OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/refresh` - Refresh JWT token

### Events

- `GET /api/events` - Get all user events
- `GET /api/events/:id` - Get single event with tasks
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event (soft delete)
- `POST /api/events/:id/notes` - Add note to event
- `PATCH /api/events/:id/progress` - Update event progress
- `GET /api/events/:id/stats` - Get event statistics

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/stats` - Get user statistics
- `PATCH /api/users/preferences` - Update user preferences
- `DELETE /api/users/account` - Delete user account

### Health Check

- `GET /api/health` - Server health status

## Data Models

### User
- Firebase UID and basic profile info
- Preferences (theme, notifications, timezone)
- Statistics (events, tasks, streaks)
- Timestamps and activity tracking

### Event
- Life events (moving, job change, college, etc.)
- Budget tracking and progress
- Location and tags
- Notes and attachments
- Status management

### Task
- Individual tasks within events
- Priority levels and categories
- Time tracking and cost estimation
- Dependencies and reminders
- Recurring task support

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Request validation and sanitization
- **JWT Authentication**: Secure token-based authentication
- **Ownership Verification**: Users can only access their own data

## Development

### Project Structure

```
Backend/
├── controllers/     # Business logic
├── routes/         # API route definitions
├── models/         # Database models
├── middlewares/    # Custom middleware
├── config/         # Configuration files
├── app.js          # Main application file
├── package.json    # Dependencies and scripts
└── README.md       # This file
```

### Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | localhost:27017/lifebuddy |
| `JWT_SECRET` | JWT signing secret | required |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI schedule/motivation | required |
| `OPENROUTER_MODEL` | Primary OpenRouter model identifier (overrides config if set) | meta-llama/llama-3.1-8b-instruct:free |

## Telegram Connect Flow
- Users now connect Telegram by clicking a button in the app and sending /start to the bot (@lifebuddy_AI_bot).
- The bot links their Telegram chat ID to their LifeBuddy account via the backend.
- No need for users to enter their chat ID manually.

### Bot Setup
- Set TELEGRAM_BOT_TOKEN and BACKEND_URL in your .env.
- Run the bot with `node bot/lifebuddy_telegram_bot.js`.

### Backend Endpoint
- POST /api/users/telegram/link { userId, chatId }

## Deployment

### Render (Recommended)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Other Platforms

- **Heroku**: Add `Procfile` and set environment variables
- **Railway**: Connect repository and configure
- **DigitalOcean**: Use App Platform or Droplets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of LifeBuddy and follows the same license terms. 