import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './utils/AuthContext';
import { DarkModeProvider, useDarkMode } from './utils/DarkModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import TasksPage from './pages/TaskPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import TestPage from './pages/TestPage';

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </main>
    </div>
  );
}

function AppContent() {
  const { darkMode } = useDarkMode();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>

      {/* Toast Notifications with Dark Mode Support */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: darkMode ? '#374151' : '#ffffff',
            color: darkMode ? '#f9fafb' : '#111827',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: darkMode 
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
          },
          success: {
            duration: 3000,
            style: {
              background: '#059669',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#059669',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#dc2626',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#dc2626',
            },
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#3b82f6',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <Router>
          <AppContent />
        </Router>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;