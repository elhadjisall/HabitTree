import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import LandingPage from './views/LandingPage';
import MainMenu from './views/MainMenu';
import Calendar from './views/Calendar';
import QuestCreation from './views/QuestCreation';
import TreeCharacter from './views/TreeCharacter';
import Settings from './views/Settings';
import Friends from './views/Friends';
import FriendProfile from './views/FriendProfile';
import FriendTree from './views/FriendTree';
import { initializeDarkMode } from './utils/darkModeStorage';
import './styles/global.css';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="app">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<MainMenu />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/create" element={<QuestCreation />} />
          <Route path="/tree" element={<TreeCharacter />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/friends/profile/:username" element={<FriendProfile />} />
          <Route path="/friends/tree/:username" element={<FriendTree />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      {!isLandingPage && <BottomNav />}
    </div>
  );
}

function App() {
  // Initialize dark mode on app load
  useEffect(() => {
    initializeDarkMode();
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
