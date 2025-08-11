import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../utils/DarkModeContext';
import { useAuth } from '../utils/DarkModeContext';
import { useAuth } from '../utils/AuthContext';

// Inside the Sidebar component:
const { logout } = useAuth();

function Sidebar() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const menuItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 h-screen shadow-lg border-r border-gray-200 dark:border-gray-700">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">My Web App</h2>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Dark Mode Toggle */}
      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span className="text-xl mr-3">{darkMode ? '☀️' : '🌙'}</span>
          <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
    onClick={() => logout()}
    className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
  >
    <span className="text-xl mr-3">🚪</span>
    <span className="font-medium">Logout</span>
  </button>
      </div>
    </div>
  );
}

export default Sidebar;