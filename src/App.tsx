import { useState } from 'react';
import LandingPage from './components/LandingPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  return <LandingPage onLogin={() => setIsAuthenticated(true)} />;
}
