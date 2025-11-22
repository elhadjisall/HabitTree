import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import MainMenu from './views/MainMenu';
import Calendar from './views/Calendar';
import QuestCreation from './views/QuestCreation';
import TreeCharacter from './views/TreeCharacter';
import Settings from './views/Settings';
import Friends from './views/Friends';
import FriendProfile from './views/FriendProfile';
import { initializeDarkMode } from './utils/darkModeStorage';
import './styles/global.css';
import './App.css';

function App() {
  // Initialize dark mode on app load
  useEffect(() => {
    initializeDarkMode();
  }, []);

  return (
    <Router>
      <div className="app">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/create" element={<QuestCreation />} />
            <Route path="/tree" element={<TreeCharacter />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/friends/profile/:username" element={<FriendProfile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
