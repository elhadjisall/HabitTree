import { useState } from 'react';
import { Sprout, X, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import './LandingPage.css';

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Connect to your backend here
    console.log(isLogin ? 'Login' : 'Signup', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (login: boolean) => {
    setIsLogin(login);
    setShowModal(true);
  };

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

          {/* Tree Growth Visual */}
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

        {/* Features */}
        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">🌳</div>
            <h3 className="feature-title">Visual Streak Growth</h3>
            <p className="feature-text">
              Watch your habits transform into beautiful trees. The longer your streak, the mightier your forest!
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🍃</div>
            <h3 className="feature-title">Earn Leaf Dollars</h3>
            <p className="feature-text">
              Complete habits to earn currency. Spend it on unlocking adorable character companions!
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🐸</div>
            <h3 className="feature-title">Unlock Cool Characters</h3>
            <p className="feature-text">
              Collect cute companions that cheer you on. Each character brings unique motivation vibes!
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3 className="feature-title">Track Your Progress</h3>
            <p className="feature-text">
              Beautiful charts and insights to see how far you've come on your habit journey.
            </p>
          </div>
        </section>

        {/* Removed Characters Section */}
        
      </main>

      {/* Auth Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="modal-close">
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

            <form onSubmit={handleSubmit} className="modal-form">
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" />
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className="input"
                      placeholder="Forest Grower"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {isLogin && (
                <div className="form-footer">
                  <label className="checkbox-label">
                    <input type="checkbox" className="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="link">Forgot password?</a>
                </div>
              )}

              <button type="submit" className="btn-submit">
                {isLogin ? 'Continue Growing' : 'Plant Your First Tree'}
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
                <button onClick={() => setIsLogin(!isLogin)} className="link">
                  {isLogin ? 'Sign up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
