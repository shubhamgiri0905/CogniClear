import React from 'react';
import { Brain, LayoutDashboard, PlusCircle, List, User as UserIcon, LogOut } from 'lucide-react';
import { User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  isOnboarding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, user, onLogout, isOnboarding }) => {
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-20 lg:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col transition-all duration-300 ${isOnboarding ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <Brain className="w-8 h-8 text-indigo-500" />
          <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight">CogniClear</span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          <NavItem
            icon={<LayoutDashboard size={22} />}
            label="Dashboard"
            isActive={activeTab === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          <NavItem
            icon={<PlusCircle size={22} />}
            label="New Decision"
            isActive={activeTab === 'new'}
            onClick={() => onNavigate('new')}
          />
          <NavItem
            icon={<List size={22} />}
            label="Decision Log"
            isActive={activeTab === 'log'}
            onClick={() => onNavigate('log')}
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center lg:px-2 opacity-80 cursor-default">
              <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block ml-3">
                <p className="text-sm font-medium text-slate-200 truncate max-w-[100px]">{user?.name}</p>
                <p className="text-xs text-slate-500">Free Plan</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-600 hover:text-red-400 transition-colors p-2"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-900 relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
        ? 'bg-indigo-600/10 text-indigo-400'
        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`}
  >
    <span className={`${isActive ? 'text-indigo-400' : 'group-hover:text-white'}`}>{icon}</span>
    <span className={`hidden lg:block ml-3 font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
    {isActive && <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
  </button>
);

export default Layout;