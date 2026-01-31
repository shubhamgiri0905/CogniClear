import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DecisionForm from './components/DecisionForm';
import DecisionList from './components/DecisionList';
import DecisionDetail from './components/DecisionDetail';
import AuthScreen from './components/AuthScreen';
import { Decision, User } from '../types';
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
      // Fetch decisions from API
      import('./services/decisionService').then(({ decisionService }) => {
        decisionService.getAll().then((fetchedDecisions) => {
          setDecisions(fetchedDecisions);
          if (fetchedDecisions.length === 0) {
            setShowWelcomeModal(true);
          }
        }).catch(err => console.error("Failed to fetch decisions", err));
      });
    } else {
      setDecisions([]);
    }
  }, [user]);

  // Generate patterns when decisions change
  useEffect(() => {
    if (user && decisions.length > 0) {
      generatePatterns(decisions).then(setPatterns);
    }
  }, [decisions, user]);

  const handleAuthSuccess = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    import('./services/authService').then(({ authService }) => {
      authService.logout();
      setUser(null);
      setDecisions([]);
      setPatterns(null);
      setShowWelcomeModal(false);
    });
  }

  const startOnboarding = () => {
    setShowWelcomeModal(false);
    setIsOnboarding(true);
    setActiveTab('new');
  };

  const handleSaveDecision = async (decision: Decision) => {
    try {
      const { decisionService } = await import('./services/decisionService');
      // Backend now configured to accept String _id (UUID)
      const newDecision = await decisionService.create(decision);

      setDecisions(prev => [newDecision, ...prev]);
      setSelectedDecisionId(newDecision.id);

      if (isOnboarding) {
        setIsOnboarding(false);
        setShowCompletionModal(true);
      } else {
        setActiveTab('detail');
      }
    } catch (error) {
      console.error("Failed to save decision", error);
    }
  };

  const handleUpdateDecision = async (updatedDecision: Decision) => {
    try {
      const { decisionService } = await import('./services/decisionService');
      const result = await decisionService.update(updatedDecision.id, updatedDecision);
      setDecisions(prev => prev.map(d => d.id === result.id ? result : d));
    } catch (error) {
      console.error("Failed to update decision", error);
    };
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