import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, X, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import './LandingPage.css';
import { login, register, type LoginCredentials, type RegisterData } from '../services/auth';

const characterImage = '/assets/characters/bike-character.jpeg'; 
const bannerImage = '/assets/characters/three-characters.jpeg';

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

  // Removed unused handleGetStarted - using openModal instead

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
          password2: password2,
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

  const openModal = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setShowAuthModal(true);
    setError('');
  };

  const features = [
    {
      emoji: '🌳',
      title: 'Visual Streak Growth',
      description: 'Watch your habits transform into beautiful trees. The longer your streak, the mightier your forest!'
    },
    {
      emoji: '🍃',
      title: 'Earn Leaf Dollars',
      description: 'Complete habits to earn currency. Spend it on unlocking adorable character companions!'
    },
    {
      emoji: '🐸',
      title: 'Unlock Cool Characters',
      description: 'Collect cute companions that cheer you on. Each character brings unique motivation vibes!'
    },
    {
      emoji: '📈',
      title: 'Track Your Progress',
      description: 'Beautiful charts and insights to see how far you\'ve come on your habit journey.'
    }
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <Sprout className="icon" />
          </div>
          <div>
            <h1 className="logo-title">HabitTree</h1>
            <p className="logo-subtitle">Grow with every habit</p>
          </div>
        </div>
        <div className="header-buttons">
          <button onClick={() => openModal(true)} className="btn-outline">
            <LogIn className="icon-sm" />
            Login
          </button>
          <button onClick={() => openModal(false)} className="btn-primary">
            <UserPlus className="icon-sm" />
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="main">
        <section className="hero">
          <div className="badge">
            <span>🌟 Plant Your Success Journey</span>
          </div>

          <h1 className="hero-title">
            Watch Your Habits
            <br />
            <span className="hero-accent">Grow Into Trees 🌳</span>
          </h1>

          <p className="hero-text">
            Build powerful habits and watch your personal forest flourish. 
            Earn Leaf Dollars 🍃, unlock adorable companions, and visualize your growth journey!
          </p>

          <div className="hero-buttons">
            <button onClick={() => openModal(false)} className="btn-primary-lg">
              Start Growing Free
            </button>
            <button onClick={() => openModal(true)} className="btn-outline-lg">
              I Already Have an Account
            </button>
          </div>

          {/* Character Image Section */}
          <div className="character-section">
            <div className="character-image-container">
              <img 
                src={characterImage} 
                alt="HabitTree characters - cute companions cheering you on" 
                className="character-image"
              />
              <div className="character-image-overlay">
                <span className="overlay-text">Meet your habit companions!</span>
              </div>
            </div>
            <p className="character-description">
              Unlock cool characters that will motivate and cheer you on throughout your habit journey!
            </p>
          </div>

          <div className="tree-growth">
            <div className="tree-stage">
              <div className="tree-box">
                <span className="tree-emoji">🌱</span>
              </div>
              <p className="tree-label">Day 1-7</p>
              <p className="tree-name">Seedling</p>
              <p className="tree-reward">+10 🍃</p>
            </div>
            <div className="tree-stage">
              <div className="tree-box">
                <span className="tree-emoji">🌿</span>
              </div>
              <p className="tree-label">Day 8-30</p>
              <p className="tree-name">Sapling</p>
              <p className="tree-reward">+25 🍃</p>
            </div>
            <div className="tree-stage active">
              <div className="tree-box active">
                <span className="tree-emoji">🌳</span>
              </div>
              <p className="tree-label active">Day 30+</p>
              <p className="tree-name active">Mighty Tree</p>
              <p className="tree-reward">+50 🍃</p>
            </div>
            <div className="tree-stage">
              <div className="tree-box">
                <span className="tree-emoji">🏞️</span>
              </div>
              <p className="tree-label">Day 90+</p>
              <p className="tree-name">Ancient Forest</p>
              <p className="tree-reward">+100 🍃</p>
            </div>
          </div>
        </section>

        <section className="features">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.emoji}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-text">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="banner-section">
          <div className="banner-container">
            <div className="banner-content">
              <h2 className="banner-title">Ready to Grow Your Forest?</h2>
              <p className="banner-text">
                Join thousands of users who have transformed their habits into beautiful forests. 
                Start your journey today and watch your personal growth blossom!
              </p>
              <button onClick={() => openModal(false)} className="btn-primary-lg">
                Plant Your First Tree 🌱
              </button>
            </div>
            <div className="banner-image-placeholder">
              <span className="banner-image-text">Your Forest Awaits</span>
              <img src={bannerImage} alt="Beautiful forest representation" className="banner-image" />
            </div>
          </div>
        </section>
      </main>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAuthModal(false)} className="modal-close">
              <X className="icon" />
            </button>

            <div className="modal-header">
              <div className="modal-icon">
                <Sprout className="icon-lg" />
              </div>
              <h2 className="modal-title">
                {isLogin ? 'Welcome Back!' : 'Start Your Journey'}
              </h2>
              <p className="modal-subtitle">
                {isLogin ? 'Continue growing your habit forest 🌳' : 'Plant your first habit tree today 🌱'}
              </p>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="modal-form" noValidate>
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div className="input-wrapper">
                    <User className="input-icon" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input"
                      placeholder="Enter your username"
                      required={!isLogin}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    minLength={isLogin ? undefined : 8}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      className="input"
                      placeholder="••••••••"
                      required={!isLogin}
                      disabled={loading}
                      minLength={8}
                    />
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="form-footer">
                  <label className="checkbox-label">
                    <input type="checkbox" className="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="link">Forgot password?</a>
                </div>
              )}

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Please wait...' : (isLogin ? 'Continue Growing' : 'Plant Your First Tree')}
              </button>

              {!isLogin && (
                <div className="bonus-banner">
                  🎁 Start with <span>50 Leaf Dollars</span> bonus!
                </div>
              )}
            </form>

            <div className="modal-footer">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={toggleAuthMode} className="link" disabled={loading}>
                  {isLogin ? 'Sign up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
