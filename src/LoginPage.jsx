import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import logo from './assets/sensaibiz-logo.png';

export default function LoginPage({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      if (isSignup && !companyName.trim()) {
        alert("Please enter your company name.");
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.post('https://n8n.sensaibiz.au/webhook/onboard', {
          auth_code: codeResponse.code,
          companyName: companyName,
          type: isSignup ? 'signup' : 'login'
        });

        if (response.data.status === 'error') {
          alert(response.data.message);
          return;
        }
        onLoginSuccess(response.data.token);
      } catch (error) {
        console.error("Auth Error:", error);
        alert("Authentication failed.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => alert("Google Login failed."),
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive'
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="p-6 flex items-center justify-center">
            <img
              src={logo}
              alt="SensaiBiz"
              className="w-8 h-8 object-contain bg-transparent"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SensaiBiz</h1>
          <p className="text-slate-500 mt-2">
            {isSignup ? "Start your 7-day free trial." : "Welcome back! Sign in to continue."}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isSignup ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Log In
          </button>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isSignup ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sign Up
          </button>
        </div>

        {isSignup && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="Acme Corp"
            />
          </div>
        )}

        <button
          onClick={() => login({ prompt: isSignup ? 'consent' : 'select_account' })}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-70"
        >
          {isLoading ? (
            <span>Connecting...</span>
          ) : (
            <>
              {/* Simple Google G Icon SVG */}
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {isSignup ? "Sign up with Google" : "Log in with Google"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
