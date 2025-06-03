// MainApp.js - Main application wrapper
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import HomePage from './Homepage';
import NeedHelp from './Needhelp';
import HelpOthers from './HelpOthers';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

// App Routes Component
function AppRoutes() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/NeedHelp" 
          element={
            <ProtectedRoute>
              <NeedHelp />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/HelpOthers" 
          element={
            <ProtectedRoute>
              <HelpOthers />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <footer>
            <h1 className="flex justify-center text-center bg-[#0f172a] text-slate-300 font-bold text-[1.2em]">&copy; 2025 Kirubakaran V</h1>
      </footer>     
    </AuthProvider>
  );
}