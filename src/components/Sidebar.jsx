import React from 'react';
import { LayoutDashboard, MessageSquareText, FileSpreadsheet, FolderKanban, PenTool, Settings, LogOut, Users } from 'lucide-react';
import logo from '../assets/sensaibiz-logo.png'; 

export default function Sidebar({ activeModule, setActiveModule, onLogout, allowedModules = [] }) {
  
  // Define ALL possible items
  const allMenuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard }, // Core
    { id: 'va', label: 'Virtual Assistant', icon: MessageSquareText }, // Core
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'content', label: 'Content Factory', icon: PenTool },
    { id: 'accounting', label: 'Accounting', icon: FileSpreadsheet },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'settings', label: 'Settings', icon: Settings }, // Core
  ];

  // Filter based on subscription
  // We always show Settings and Dashboard/VA if they are in the list
  const visibleItems = allMenuItems.filter(item => {
    // Always show Settings
    if (item.id === 'settings') return true;
    // Check if the item ID exists in the allowedModules array sent from Backend
    return allowedModules.includes(item.id);
  });

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <img src={logo} alt="SensaiBiz" className="w-8 h-8 object-contain bg-transparent" />
        <h1 className="text-xl font-bold text-white tracking-tight">SensaiBiz</h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
