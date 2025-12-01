import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { login, register, type LoginCredentials, type RegisterData } from '../services/auth';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleGetStarted = () => {
    setShowAuthModal(true);
    setError('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const credentials: LoginCredentials = {
          email: email.trim(),
          password: password
        };
        await login(credentials);
        // Navigate to app on success
        navigate('/app');
      } else {
        // Register
        if (password !== password2) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        const registerData: RegisterData = {
          email: email.trim(),
          username: username.trim(),
          password: password,
          password2: password2
        };
        await register(registerData);
        // Navigate to app on success (register also logs in)
        navigate('/app');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error?.message || (isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setUsername('');
    setPassword('');
    setPassword2('');
    setError('');
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
            {error && (
              <div className="auth-error" style={{ 
                color: '#ff6b6b', 
                padding: '10px', 
                marginBottom: '15px', 
                background: 'rgba(255, 107, 107, 0.1)', 
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            <form className="auth-form" onSubmit={handleAuth}>
              {!isLogin && (
                <div className="auth-input-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                  />
                </div>
              )}
              <div className="auth-input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
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
                  disabled={loading}
                  minLength={isLogin ? undefined : 8}
                />
              </div>
              {!isLogin && (
                <div className="auth-input-group">
                  <label htmlFor="password2">Confirm Password</label>
                  <input
                    type="password"
                    id="password2"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>
              )}
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
              </button>
            </form>
            <p className="auth-toggle">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="auth-toggle-btn" onClick={toggleAuthMode} disabled={loading}>
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
