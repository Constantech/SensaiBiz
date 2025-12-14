import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';

const GOOGLE_CLIENT_ID = "192308229213-82s0cah0uu4ghicdhbqbcb88he0jquo7.apps.googleusercontent.com";

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('sensaibiz_jwt');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLoginSuccess = (receivedToken) => {
    localStorage.setItem('sensaibiz_jwt', receivedToken);
    setToken(receivedToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('sensaibiz_jwt');
    setToken(null);
  };

  // No inline styles here anymore. Tailwind handles the full screen in the components.
  return (
    <>
      {token ? (
        <DashboardPage onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default function WrappedApp() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
}
