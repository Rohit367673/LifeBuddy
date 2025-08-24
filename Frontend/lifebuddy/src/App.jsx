import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PremiumProvider } from './context/PremiumContext';
import Premium from './pages/Premium';
import SubscribeSuccess from './pages/SubscribeSuccess';
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
import Productivity from './pages/Productivity';
import PremiumCalendar from './pages/PremiumCalendar';
import MySchedule from './pages/MySchedule';
import AIChat from './components/AIChat';
import VoiceChat from './pages/VoiceChat';
import AdminCouponPanel from './components/AdminCouponPanel';
import ProtectedRoute from './components/ProtectedRoute';
import AISchedulingUpsell from './components/AISchedulingUpsell';
import AdManager from './components/AdManager';
import PromoVideo from './components/PromoVideo';
import { getApiUrl } from './utils/config';
import React, { useState, useEffect } from 'react';
import { daysSince } from './utils/dates';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoActive, setPromoActive] = useState(false);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/user`);
        const data = await response.json();
        setUser(data);
        // Check if promo should be active
        if (data && !data.isPremium) {
          const signupDate = new Date(data.signupDate);
          const days = daysSince(signupDate);
          setPromoActive(days <= 7);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleUpgrade = () => {
    // Placeholder for upgrade function
    console.log('Upgrade to premium');
  };

  const handlePromoClose = () => {
    setPromoActive(false);
  };

  // Only show ads if promo is not active
  const showAds = !promoActive;

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
                <Route path="/subscribe-success" element={<SubscribeSuccess />} />
                <Route path="/profile/:identifier" element={<PublicProfile />} />
                {/* Direct voice route (also added inside MainLayout below) */}
                <Route path="/ai-voice" element={<VoiceChat />} />
                <Route path="/voice-chat" element={<VoiceChat />} />
                <Route path="/voice-chat" element={<VoiceChat />} />

                {/* Main layout with nested routes */}
                <Route element={<MainLayout />}>
                  <Route path="/productivity" element={
                    <ProtectedRoute
                      inlineFallback={<AISchedulingUpsell />}
                    >
                      <Productivity />
                    </ProtectedRoute>
                  } />
                  <Route path="/ai-chat" element={<AIChat />} />
                  <Route path="/ai-voice" element={<VoiceChat />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/my-schedule" element={<MySchedule />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/new" element={<EventForm />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/events/:id/edit" element={<EventForm />} />
                  <Route path="/daily-tools" element={<DailyTools />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin/coupons" element={<AdminCouponPanel />} />
                </Route>
                {/* Fallback */}
                <Route path="*" element={<div style={{ padding: 16 }}>Page not found</div>} />
              </Routes>
              <AdManager user={user} promoActive={promoActive} />
              <PromoVideo 
                user={user} 
                onUpgrade={handleUpgrade}
                onClose={handlePromoClose}
                isActive={promoActive}
              />
            </div>
          </PremiumProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
