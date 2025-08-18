import React, { useState, useMemo, JSX } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../utils/DarkModeContext';
import { useAuth } from '../utils/AuthContext';
import ProfilePicture from './ProfilePicture';

// Modern monochrome icons as SVG components
const Icons = {
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Tasks: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
};

interface MenuItem {
  path: string;
  label: string;
  icon: keyof typeof Icons;
  count?: number;
}

function Sidebar(): JSX.Element {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { currentUser, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'Home' },
    { path: '/calendar', label: 'Calendar', icon: 'Calendar' },
    { path: '/', label: 'Tasks', icon: 'Tasks', count: 32 },
    { path: '/settings', label: 'Settings', icon: 'Settings' },
  ];

  const getUserDisplayName = (): string => {
    return currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  };

  // Filter menu items based on search query
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    
    return menuItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-80';

  return (
    <div className={`${sidebarWidth} bg-white dark:bg-gray-900 h-screen shadow-xl border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
      {/* Header with Profile */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <div className="flex items-center space-x-4">
              <ProfilePicture />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {getUserDisplayName()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manager</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <ProfilePicture />
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          >
            {isCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-6 py-6">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComponent = Icons[item.icon];
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
                    <div className="transition-transform group-hover:scale-110">
                      <IconComponent />
                    </div>
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                  
                  {item.count && !isCollapsed && (
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isActive 
                          ? 'bg-white bg-opacity-20 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {item.count}
                      </span>
                      {isActive && (
                        <div className="w-6 h-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white">
                          <Icons.Plus />
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* No results message */}
        {searchQuery && filteredMenuItems.length === 0 && !isCollapsed && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No items found for "{searchQuery}"
            </p>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          title={isCollapsed ? (darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode') : ''}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <div className="text-gray-600 dark:text-gray-300">
              {darkMode ? <Icons.Sun /> : <Icons.Moon />}
            </div>
            {!isCollapsed && <span className="font-medium">{darkMode ? 'Light' : 'Dark'}</span>}
          </div>
          
          {!isCollapsed && (
            <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
              darkMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${
                darkMode ? 'translate-x-6 ml-1' : 'translate-x-1'
              }`}></div>
            </div>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center px-4 py-3 rounded-xl transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          title={isCollapsed ? 'Logout' : ''}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <Icons.Logout />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </div>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;