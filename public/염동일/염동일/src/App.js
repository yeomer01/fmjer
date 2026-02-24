import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/modals/LoginScreen';
import DefectManagerApp from './components/DefectManagerApp';

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogin = (user) => {
    setLoggedInUser(user);
    localStorage.setItem('er_logged_in_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('er_logged_in_user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('er_logged_in_user');
    if (savedUser) {
      try {
        setLoggedInUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('er_logged_in_user');
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      {!loggedInUser ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <DefectManagerApp loggedInUser={loggedInUser} onLogout={handleLogout} />
      )}
    </ErrorBoundary>
  );
}
