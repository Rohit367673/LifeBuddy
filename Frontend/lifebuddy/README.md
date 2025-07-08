# LifeBuddy Frontend

A modern React application for managing life events and daily productivity tools.

## Features

- **Modern UI/UX**: Built with React 19, Tailwind CSS, and Heroicons
- **Authentication**: Firebase Auth integration with email/password and Google sign-in
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Real-time Updates**: Toast notifications and loading states
- **Type Safety**: Full TypeScript support (coming soon)

## Tech Stack

- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS with custom components
- **Icons**: Heroicons and Lucide React
- **Authentication**: Firebase Auth
- **State Management**: React Context + Hooks
- **Routing**: React Router v7
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## Quick Start

### Prerequisites

- Node.js 20.19.0 or higher
- npm or yarn
- Firebase project (for authentication)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Main navigation bar
│   └── Sidebar.jsx     # Sidebar navigation
├── context/            # React Context providers
│   └── AuthContext.jsx # Authentication context
├── layouts/            # Layout components
│   └── MainLayout.jsx  # Main app layout
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Login page
│   ├── Signup.jsx      # Registration page
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Events.jsx      # Events list
│   ├── EventDetail.jsx # Event details
│   ├── EventForm.jsx   # Event creation/editing
│   ├── DailyTools.jsx  # Daily productivity tools
│   ├── Analytics.jsx   # Analytics and insights
│   └── Settings.jsx    # User settings
├── utils/              # Utility functions
│   └── firebaseConfig.js # Firebase configuration
├── App.jsx             # Main app component
├── main.jsx            # App entry point
└── index.css           # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Components

### Authentication
- Firebase Auth integration
- Email/password and Google sign-in
- Protected routes
- JWT token management

### Layout System
- Responsive sidebar navigation
- Mobile-friendly design
- Toast notifications
- Loading states

### Styling
- Custom Tailwind CSS configuration
- Component-based design system
- Responsive utilities
- Dark mode support (coming soon)

## Development

### Adding New Pages
1. Create a new component in `src/pages/`
2. Add the route to `src/App.jsx`
3. Update navigation in `src/components/Sidebar.jsx` if needed

### Styling Guidelines
- Use Tailwind CSS classes for styling
- Follow the component system (`.btn`, `.card`, etc.)
- Use the color palette defined in `tailwind.config.js`
- Ensure responsive design for all components

### State Management
- Use React Context for global state (auth, user data)
- Use local state for component-specific data
- Consider Redux Toolkit for complex state (future)

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Connect repository and configure build settings
- **Firebase Hosting**: Use `firebase deploy`
- **GitHub Pages**: Use `npm run build` and deploy `dist/` folder

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID | No |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of LifeBuddy and follows the same license terms.
