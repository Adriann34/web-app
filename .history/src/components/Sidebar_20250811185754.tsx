import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../utils/DarkModeContext';
import { useAuth } from '../utils/AuthContext';
import ProfilePicture from './ProfilePicture';

function Sidebar() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { currentUser, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '🏠', count: null },
    { path: '/calendar', label: 'Calendar', icon: '📅', count: null },
    { path: '/dashboard', label: 'Tasks', icon: '💼', count: 32 },
    { path: '/settings', label: 'Settings', icon: '⚙️', count: null },
  ];

  const getUserDisplayName = () => {
    return currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 h-screen shadow-xl border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header with Profile */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 mb-6">
          <ProfilePicture />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {getUserDisplayName()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manager</p>
          </div>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <span className="text-gray-400">←</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-6 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-xl transition-transform group-hover:scale-110 ${
                      isActive ? 'filter brightness-0 invert' : ''
                    }`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  
                  {item.count && (
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isActive 
                          ? 'bg-white bg-opacity-20 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {item.count}
                      </span>
                      {isActive && (
                        <div className="w-6 h-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">+</span>
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
            <span className="font-medium">{darkMode ? 'Light' : 'Dark'}</span>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
            darkMode ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${
              darkMode ? 'translate-x-6 ml-1' : 'translate-x-1'
            }`}></div>
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;