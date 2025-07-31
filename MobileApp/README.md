# LifeBuddy Mobile App

A React Native mobile application that mirrors the functionality of the LifeBuddy web platform, providing comprehensive life management tools including event scheduling, task management, mood tracking, and productivity features.

## Features

### Core Features
- **Dashboard**: Overview of events, tasks, achievements, and motivational messages
- **Event Management**: Create, edit, and track life events (moving, job changes, weddings, etc.)
- **Task Management**: Organize tasks with priorities, due dates, and completion tracking
- **Mood Tracking**: Daily mood logging with streak tracking
- **Achievements**: Gamified achievement system with points and badges
- **Analytics**: Comprehensive insights into productivity and life patterns
- **Premium Features**: Advanced tools for premium subscribers

### Technical Features
- **Cross-platform**: iOS and Android support
- **Dark/Light Mode**: Automatic theme switching with manual override
- **Offline Support**: Basic offline functionality with sync
- **Push Notifications**: Real-time reminders and updates
- **Biometric Authentication**: Secure login with fingerprint/face ID
- **Data Sync**: Seamless synchronization with web platform

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LifeBuddy/MobileApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration:
   - Set `EXPO_PUBLIC_API_URL` to your backend URL
   - Configure Firebase settings if using Firebase
   - Set feature flags as needed

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Loading, etc.)
│   └── specific/       # Feature-specific components
├── context/            # React Context providers
│   ├── AuthContext.tsx # Authentication state management
│   └── ThemeContext.tsx # Theme state management
├── navigation/          # Navigation configuration
│   └── AppNavigator.tsx # Main navigation setup
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── main/           # Main app screens
│   └── common/         # Shared screens
├── services/           # API and external services
│   └── api.ts          # API service layer
├── types/              # TypeScript type definitions
│   └── index.ts        # Main type definitions
└── utils/              # Utility functions
```

## Development

### Running the App

**iOS Simulator:**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Web Browser:**
```bash
npm run web
```

### Building for Production

**iOS:**
```bash
eas build --platform ios
```

**Android:**
```bash
eas build --platform android
```

### Code Style

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

Run linting:
```bash
npm run lint
```

## API Integration

The app integrates with your existing LifeBuddy backend API. Key endpoints:

- **Authentication**: `/api/auth/*`
- **Events**: `/api/events/*`
- **Tasks**: `/api/tasks/*`
- **Mood**: `/api/mood/*`
- **Achievements**: `/api/achievements/*`
- **User Profile**: `/api/users/*`

## State Management

The app uses React Context for state management:

- **AuthContext**: Manages user authentication state
- **ThemeContext**: Manages theme preferences
- **PremiumContext**: Manages premium subscription state

## Navigation

The app uses React Navigation with:
- **Stack Navigator**: For main app flow
- **Tab Navigator**: For main sections
- **Drawer Navigator**: For additional features

## Styling

The app uses a custom theming system with:
- Dynamic color schemes (light/dark mode)
- Consistent spacing and typography
- Responsive design patterns
- Platform-specific styling

## Testing

Run tests:
```bash
npm test
```

## Deployment

### Expo Application Services (EAS)

1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Build and submit:**
   ```bash
   eas build --platform all
   eas submit --platform ios
   eas submit --platform android
   ```

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx expo start --clear
   ```

2. **iOS build issues:**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues:**
   - Clean Android build: `cd android && ./gradlew clean && cd ..`

### Performance Optimization

- Use React.memo for expensive components
- Implement proper list virtualization
- Optimize images and assets
- Use appropriate caching strategies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial release
- Core features implementation
- iOS and Android support
- Backend integration 