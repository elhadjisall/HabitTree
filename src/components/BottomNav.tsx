import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <NavLink
        to="/"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        aria-label="Main Menu"
      >
        <div className="nav-icon">📋</div>
        <span className="nav-label">Menu</span>
      </NavLink>

      <NavLink
        to="/calendar"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        aria-label="Calendar"
      >
        <div className="nav-icon">📅</div>
        <span className="nav-label">Calendar</span>
      </NavLink>

      <NavLink
        to="/create"
        className={({ isActive }) => isActive ? 'nav-item nav-item-create active' : 'nav-item nav-item-create'}
        aria-label="Create Quest"
      >
        <div className="nav-icon nav-icon-create">➕</div>
      </NavLink>

      <NavLink
        to="/tree"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        aria-label="Tree & Character"
      >
        <div className="nav-icon">🌳</div>
        <span className="nav-label">Tree</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        aria-label="Settings"
      >
        <div className="nav-icon">⚙️</div>
        <span className="nav-label">Settings</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
