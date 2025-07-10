import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PremiumProvider } from './context/PremiumContext';
import Premium from './pages/Premium';
import Store from './pages/Store';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventForm from './pages/EventForm';
import DailyTools from './pages/DailyTools';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <PremiumProvider>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/store" element={<MainLayout><Store /></MainLayout>} />
                <Route path="/profile/:identifier" element={<PublicProfile />} />
                
                {/* Protected routes */}
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/new" element={<EventForm />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/events/:id/edit" element={<EventForm />} />
                  <Route path="/daily-tools" element={<DailyTools />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Routes>
            </div>
          </PremiumProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
