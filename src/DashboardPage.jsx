import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ChatInterface from './ChatInterface';
import SignatureManager from './SignatureManager';
import ContentFactory from './ContentFactory';
import CrmModule from './CrmModule';

export default function DashboardPage({ onLogout }) {
  const [activeModule, setActiveModule] = useState('va'); // Default to VA
  const [userEmail, setUserEmail] = useState("Loading...");
  const [allowedModules, setAllowedModules] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('sensaibiz_jwt');
      if (!token) {
        onLogout();
        return;
      }

      try {
        const response = await axios.get('https://n8n.sensaibiz.au/webhook/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        const userData = Array.isArray(response.data) ? response.data[0] : response.data;
          setUserEmail(userData.email);
  
        // NEW: Set the allowed modules (Default to just VA if empty)
          setAllowedModules(userData.activemodules || ['dashboard', 'va']);

      } catch (error) {      
        console.error("Failed to fetch user profile:", error);
        onLogout();
      }
    };
    fetchUserProfile();
  }, [onLogout]);

  // Render logic for different modules
  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Total Emails Drafted</div>
                <div className="text-3xl font-bold text-blue-600">12</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Pending Tasks</div>
                <div className="text-3xl font-bold text-purple-600">5</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Projects Active</div>
                <div className="text-3xl font-bold text-green-600">3</div>
              </div>
            </div>
            {/* We can re-use components here as widgets */}
            <div className="mt-8">
               <h3 className="text-lg font-semibold text-slate-700 mb-4">Quick Settings</h3>
               <SignatureManager />
            </div>
          </div>
        );

      case 'va':
        return (
          <div className="flex flex-col h-full p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Virtual Assistant</h2>
              <p className="text-slate-500">Chat with your AI to manage emails, calendar, and tasks.</p>
            </div>
            <ChatInterface />
          </div>
        );

      case 'settings':
        return (
          <div className="p-8 max-w-4xl">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">Settings</h2>
             <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-medium text-slate-700 mb-4 border-b pb-2">Email Configuration</h3>
                  <SignatureManager />
                </section>
                
                <section>
                  <h3 className="text-lg font-medium text-slate-700 mb-4 border-b pb-2">Account</h3>
                  <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <p className="text-slate-600">Logged in as: <span className="font-semibold text-slate-900">{userEmail}</span></p>
                  </div>
                </section>
             </div>
          </div>
        );

      case 'content':
        return <ContentFactory />;

      case 'crm':
        return <CrmModule />;

      // Placeholders for future modules
      case 'accounting':
      case 'projects':
        return (
          <div className="p-8 flex flex-col items-center justify-center h-full text-center">
            <div className="bg-slate-100 p-6 rounded-full mb-4">
               <span className="text-4xl">🚧</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Module Under Construction</h2>
            <p className="text-slate-500 max-w-md">
              The {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)} module is currently being installed. Check back later.
            </p>
          </div>
        );
      
      default:
        return <div>Select a module</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar - Fixed width */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        onLogout={onLogout}
        allowedModules={allowedModules} // <--- Pass the list here
      />
      
      {/* Main Content - Takes remaining width and pushes over by sidebar width */}
      <main className="flex-1 ml-64 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
}
