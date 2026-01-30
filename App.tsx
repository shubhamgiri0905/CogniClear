import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DecisionForm from './components/DecisionForm';
import DecisionList from './components/DecisionList';
import DecisionDetail from './components/DecisionDetail';
import AuthScreen from './components/AuthScreen';
import { Decision, User } from './types';
import { generatePatterns } from './services/geminiService';
import { Brain, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cogniclear_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  
  // Decisions are now derived from user ID
  const [decisions, setDecisions] = useState<Decision[]>([]);
  
  const [patterns, setPatterns] = useState<any>(null);

  // Onboarding States
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Load user data on mount or user change
  useEffect(() => {
    if (user) {
        localStorage.setItem('cogniclear_user', JSON.stringify(user));
        const storageKey = `cogniclear_decisions_${user.id}`;
        const savedDecisions = localStorage.getItem(storageKey);
        const userDecisions = savedDecisions ? JSON.parse(savedDecisions) : [];
        setDecisions(userDecisions);

        if (userDecisions.length === 0) {
            setShowWelcomeModal(true);
        }
    } else {
        localStorage.removeItem('cogniclear_user');
        setDecisions([]);
    }
  }, [user]);

  // Save decisions whenever they change (if user logged in)
  useEffect(() => {
    if (user) {
        const storageKey = `cogniclear_decisions_${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(decisions));
        
        // Generate patterns if we have data
        if (decisions.length > 0) {
             generatePatterns(decisions).then(setPatterns);
        }
    }
  }, [decisions, user]);

  const handleAuthSuccess = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
    setDecisions([]);
    setPatterns(null);
    setShowWelcomeModal(false);
  }

  const startOnboarding = () => {
    setShowWelcomeModal(false);
    setIsOnboarding(true);
    setActiveTab('new');
  };

  const handleSaveDecision = (decision: Decision) => {
    setDecisions(prev => [decision, ...prev]);
    setSelectedDecisionId(decision.id);
    
    if (isOnboarding) {
        setIsOnboarding(false);
        setShowCompletionModal(true);
    } else {
        setActiveTab('detail');
    }
  };

  const handleUpdateDecision = (updatedDecision: Decision) => {
    setDecisions(prev => prev.map(d => d.id === updatedDecision.id ? updatedDecision : d));
  };

  const handleNavigate = (tab: string) => {
    if (isOnboarding && tab !== 'new') return; // Prevent navigation during onboarding
    setActiveTab(tab);
    setSelectedDecisionId(null);
  };

  const handleSelectDecision = (id: string) => {
    setSelectedDecisionId(id);
    setActiveTab('detail');
  };

  const handleCompletionDismiss = () => {
      setShowCompletionModal(false);
      setActiveTab('detail');
  }

  if (!user) {
      return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const renderContent = () => {
    if (activeTab === 'detail' && selectedDecisionId) {
      const decision = decisions.find(d => d.id === selectedDecisionId);
      if (decision) {
        return (
            <DecisionDetail 
                decision={decision} 
                onBack={() => setActiveTab('log')} 
                onUpdate={handleUpdateDecision}
            />
        );
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard decisions={decisions} patterns={patterns} onSelectDecision={handleSelectDecision} />;
      case 'new':
        return <DecisionForm onSave={handleSaveDecision} isOnboarding={isOnboarding} />;
      case 'log':
        return <DecisionList decisions={decisions} onSelect={handleSelectDecision} />;
      default:
        return <Dashboard decisions={decisions} patterns={patterns} onSelectDecision={handleSelectDecision} />;
    }
  };

  return (
    <>
        <Layout 
            activeTab={activeTab === 'detail' ? 'log' : activeTab} 
            onNavigate={handleNavigate}
            user={user}
            onLogout={handleLogout}
            isOnboarding={isOnboarding}
        >
        {renderContent()}
        </Layout>

        {/* Welcome Modal */}
        {showWelcomeModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                     <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Brain className="w-8 h-8 text-indigo-400" />
                     </div>
                     <h2 className="text-2xl font-bold text-white mb-2">Welcome, {user.name}!</h2>
                     <p className="text-slate-400 mb-8 leading-relaxed">
                        To get the most out of CogniClear, let's walk through your first decision introspection together. It only takes a minute.
                     </p>
                     <button 
                        onClick={startOnboarding}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/30"
                     >
                        Start First Introspection
                     </button>
                </div>
            </div>
        )}

         {/* Completion Modal */}
         {showCompletionModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                     <div className="mx-auto w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                     </div>
                     <h2 className="text-2xl font-bold text-white mb-2">Tutorial Complete!</h2>
                     <p className="text-slate-400 mb-8 leading-relaxed">
                        You've successfully logged your first decision. You can now view the AI's analysis, see simulated outcomes, and track patterns over time.
                     </p>
                     <button 
                        onClick={handleCompletionDismiss}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/30"
                     >
                        View Results
                     </button>
                </div>
            </div>
        )}
    </>
  );
};

export default App;