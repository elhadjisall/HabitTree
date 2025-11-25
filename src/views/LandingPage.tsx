import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // NO backend logic - just navigate to app
    navigate('/app');
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
  };

  const features = [
    {
      emoji: '🎮',
      title: 'Gamified',
      description: 'Turn habits into a fun leveling system.'
    },
    {
      emoji: '🔥',
      title: 'Streaks',
      description: 'Build daily consistency and protect your streaks.'
    },
    {
      emoji: '📈',
      title: 'Visual Progress',
      description: 'Grow your habit tree as you improve.'
    },
    {
      emoji: '🧑‍🤝‍🧑',
      title: 'Unlockable Characters',
      description: 'Earn new companions as rewards.'
    },
    {
      emoji: '🎨',
      title: 'Customizable Habits',
      description: 'Create habits that match your goals.'
    },
    {
      emoji: '🌟',
      title: 'Better You',
      description: 'Small daily steps → big results.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Top Title */}
      <header className="landing-header">
        <h1 className="landing-title">
          Habi<span className="tree-emoji">🌲</span>ree
        </h1>
      </header>

      {/* First Big Horizontal Image Slot */}
      <div className="image-placeholder image-placeholder-large">
        <span className="placeholder-text">Image Placeholder – Three Characters</span>
      </div>

      {/* Get Started Button */}
      <div className="cta-section">
        <button className="get-started-btn" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>

      {/* Features Grid */}
      <section className="features-section">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-box">
              <div className="feature-emoji">{feature.emoji}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Big Banner Image Slot */}
      <div className="image-placeholder image-placeholder-banner">
        <span className="placeholder-text">Coming Soon – Character Banner Slot</span>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)}>
              ✕
            </button>
            <h2 className="auth-modal-title">Welcome to Habitree 🌲</h2>
            <form className="auth-form" onSubmit={handleAuth}>
              <div className="auth-input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="auth-input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button type="submit" className="auth-submit-btn">
                {isLogin ? 'Log In' : 'Create Account'}
              </button>
            </form>
            <p className="auth-toggle">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="auth-toggle-btn" onClick={toggleAuthMode}>
                {isLogin ? 'Create Account' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
