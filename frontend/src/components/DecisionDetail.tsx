import React, { useState, useEffect, useRef } from 'react';
import { Decision, DecisionStatus } from '../../types';
import { ArrowLeft, AlertTriangle, EyeOff, Shuffle, Brain, CheckCircle2, Send, User as UserIcon, Bot, Sparkles, XCircle, Target, ArrowRight } from 'lucide-react';
import { createSimulationChat, analyzeOutcome } from '../services/geminiService';
import { Chat } from '@google/genai';

interface DecisionDetailProps {
    decision: Decision;
    onBack: () => void;
    onUpdate: (decision: Decision) => void;
}

const DecisionDetail: React.FC<DecisionDetailProps> = ({ decision, onBack, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'simulation' | 'outcome'>('overview');
    const analysis = decision.analysis;

    // Outcome State
    const [outcomeInput, setOutcomeInput] = useState('');
    const [isAnalyzingOutcome, setIsAnalyzingOutcome] = useState(false);

    // Chat State
    const [isChatActive, setIsChatActive] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isChatActive]);

    const handleRecordOutcome = async () => {
        if (!outcomeInput.trim()) return;
        setIsAnalyzingOutcome(true);

        try {
            const outcomeAnalysis = await analyzeOutcome(decision, outcomeInput);

            const updatedDecision: Decision = {
                ...decision,
                outcome: outcomeInput,
                outcomeDate: new Date().toISOString(),
                status: DecisionStatus.COMPLETED,
                outcomeAnalysis: outcomeAnalysis,
                analysis: {
                    ...decision.analysis!,
                    clarityScore: outcomeAnalysis.updatedClarityScore // Update the score based on hindsight
                }
            };

            onUpdate(updatedDecision);
            setOutcomeInput('');
        } catch (e) {
            console.error(e);
            alert("Failed to analyze outcome.");
        } finally {
            setIsAnalyzingOutcome(false);
        }
    };

    const startSimulation = async (scenario?: string) => {
        setIsChatActive(true);
        setIsChatLoading(true);
        setChatHistory([]); // Clear history

        try {
            const chat = createSimulationChat(decision, scenario);
            setChatSession(chat);

            // Initial primer
            const response = await chat.sendMessage({ message: "Begin the simulation. Set the scene for me based on the scenario." });
            setChatHistory([{ role: 'model', text: response.text || "Simulation ready. What would you like to do?" }]);
        } catch (e) {
            console.error(e);
            setChatHistory([{ role: 'model', text: "Failed to connect to the simulation engine. Please try again." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !chatSession) return;
        const msg = chatInput;
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
        setIsChatLoading(true);

        try {
            const response = await chatSession.sendMessage({ message: msg });
            setChatHistory(prev => [...prev, { role: 'model', text: response.text || "" }]);
        } catch (e) {
            console.error(e);
            setChatHistory(prev => [...prev, { role: 'model', text: "Connection interrupted. The simulation has ended." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const exitSimulation = () => {
        setIsChatActive(false);
        setChatSession(null);
    };

    if (!analysis) return <div>Analysis not available.</div>;

    const displayEmotions = Array.isArray(decision.emotions) ? decision.emotions : [(decision as any).emotion as string];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            <button
                onClick={onBack}
                className="mb-6 flex items-center text-slate-400 hover:text-indigo-400 transition-colors"
            >
                <ArrowLeft size={18} className="mr-2" />
                Back to Log
            </button>

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white">{decision.title}</h1>
                            {decision.status === DecisionStatus.COMPLETED && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider flex items-center">
                                    <CheckCircle2 size={12} className="mr-1" />
                                    Completed
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 max-w-2xl">{decision.description}</p>
                    </div>
                    <div className="flex items-center space-x-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase font-semibold">Clarity Score</div>
                            <div className={`text-2xl font-bold ${getScoreColor(analysis.clarityScore)}`}>
                                {analysis.clarityScore}/100
                            </div>
                        </div>
                        <div className="h-10 w-px bg-slate-800"></div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase font-semibold">Emotions</div>
                            <div className="text-sm font-medium text-slate-200">{displayEmotions.join(', ')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 mb-8 overflow-x-auto">
                <button
                    onClick={() => { setActiveTab('overview'); setIsChatActive(false); }}
                    className={`pb-4 px-6 font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Introspection Map
                </button>
                <button
                    onClick={() => setActiveTab('simulation')}
                    className={`pb-4 px-6 font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'simulation' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    What-If Simulations
                </button>
                <button
                    onClick={() => { setActiveTab('outcome'); setIsChatActive(false); }}
                    className={`pb-4 px-6 font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'outcome' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Outcome & Learning
                </button>
            </div>

            {/* CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {/* Summary */}
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/20 to-slate-900/50 border border-indigo-500/20 p-6 rounded-2xl">
                        <h3 className="flex items-center text-lg font-semibold text-indigo-300 mb-3">
                            <Brain className="mr-2" size={20} />
                            AI Executive Summary
                        </h3>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            {analysis.summary}
                        </p>
                    </div>

                    {/* Biases */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                        <h3 className="flex items-center text-red-400 font-semibold mb-4">
                            <AlertTriangle className="mr-2" size={20} />
                            Detected Biases
                        </h3>
                        <div className="space-y-4">
                            {analysis.biases.map((bias, idx) => (
                                <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-slate-200">{bias.name}</span>
                                        <span className="text-xs text-red-400 bg-red-950/30 px-2 py-0.5 rounded-full border border-red-900/30">{bias.probability}% Prob.</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-3">{bias.description}</p>
                                    <div className="text-xs bg-emerald-900/10 text-emerald-400 p-2 rounded border border-emerald-900/20">
                                        <strong>💡 Mitigation:</strong> {bias.mitigation}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Blind Spots & Perspectives */}
                    <div className="space-y-6">
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                            <h3 className="flex items-center text-amber-400 font-semibold mb-4">
                                <EyeOff className="mr-2" size={20} />
                                Blind Spots
                            </h3>
                            <ul className="space-y-3">
                                {analysis.blindSpots.map((spot, idx) => (
                                    <li key={idx} className="flex items-start text-slate-300 text-sm">
                                        <span className="mr-3 text-amber-500 mt-1">•</span>
                                        {spot}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                            <h3 className="flex items-center text-indigo-400 font-semibold mb-4">
                                <Shuffle className="mr-2" size={20} />
                                Alternative Perspectives
                            </h3>
                            <ul className="space-y-3">
                                {analysis.alternativePerspectives.map((persp, idx) => (
                                    <li key={idx} className="flex items-start text-slate-300 text-sm">
                                        <span className="mr-3 text-indigo-500 mt-1">→</span>
                                        {persp}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT: SIMULATION */}
            {activeTab === 'simulation' && (
                <div className="animate-fade-in">
                    {!isChatActive ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {analysis.simulations.map((sim, idx) => (
                                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Path {idx + 1}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded border ${sim.riskLevel === 'High' ? 'border-red-900 text-red-400 bg-red-950' :
                                            sim.riskLevel === 'Medium' ? 'border-orange-900 text-orange-400 bg-orange-950' :
                                                'border-emerald-900 text-emerald-400 bg-emerald-950'
                                            }`}>
                                            {sim.riskLevel} Risk
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-100 mb-3">{sim.scenario}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        {sim.outcome}
                                    </p>
                                    <button
                                        onClick={() => startSimulation(sim.scenario)}
                                        className="w-full py-3 bg-slate-900 hover:bg-indigo-600/20 hover:text-indigo-400 text-slate-300 text-sm font-medium rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center justify-center group"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                                        Explore this path deeply
                                    </button>
                                </div>
                            ))}

                            <div className="md:col-span-2 bg-indigo-900/10 border border-indigo-500/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                                <Brain className="w-12 h-12 text-indigo-500 mb-4 opacity-80" />
                                <h3 className="text-xl font-semibold text-slate-200 mb-2">Want to roleplay a specific outcome?</h3>
                                <p className="text-slate-400 mb-6 max-w-md">Our AI can act as a stakeholder or future-self to help you experience the consequences before they happen.</p>
                                <button
                                    onClick={() => startSimulation()}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Start Simulation Chat
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[600px] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden animate-fade-in relative">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Sparkles className="text-indigo-400 mr-2 w-5 h-5" />
                                    <span className="font-semibold text-slate-200">Simulation Active</span>
                                </div>
                                <button onClick={exitSimulation} className="text-slate-500 hover:text-white flex items-center text-sm">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    End Session
                                </button>
                            </div>

                            {/* Chat Area */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-1 opacity-50 text-xs">
                                                {msg.role === 'user' ? <UserIcon size={12} /> : <Bot size={12} />}
                                                <span className="uppercase font-bold tracking-wider">{msg.role === 'user' ? 'You' : 'CogniClear'}</span>
                                            </div>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-800 rounded-2xl rounded-bl-none p-4 border border-slate-700 flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type your response to the simulation..."
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isChatLoading}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CONTENT: OUTCOME */}
            {activeTab === 'outcome' && (
                <div className="animate-fade-in max-w-3xl mx-auto">
                    {!decision.outcome ? (
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                                <Target className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-100 mb-4">Ready to close the loop?</h2>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                Recording the actual outcome helps the AI learn from your history, refine future predictions, and check if you fell into any predicted biases.
                            </p>

                            <div className="text-left max-w-xl mx-auto mb-6">
                                <label className="text-sm font-semibold text-slate-500 uppercase mb-2 block">What actually happened?</label>
                                <textarea
                                    rows={4}
                                    placeholder="e.g. I took the job, but it was more stressful than expected..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                    value={outcomeInput}
                                    onChange={(e) => setOutcomeInput(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleRecordOutcome}
                                disabled={!outcomeInput.trim() || isAnalyzingOutcome}
                                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto w-full max-w-xs"
                            >
                                {isAnalyzingOutcome ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                        <span>Analyzing Causality...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Record Outcome</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* The Outcome */}
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                                <h3 className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                    <Target className="mr-2" size={16} />
                                    The Actual Outcome
                                </h3>
                                <p className="text-slate-200 text-lg leading-relaxed">
                                    "{decision.outcome}"
                                </p>
                                <p className="text-slate-500 text-xs mt-4">
                                    Recorded on {new Date(decision.outcomeDate!).toLocaleDateString()}
                                </p>
                            </div>

                            {/* AI Reflection */}
                            {decision.outcomeAnalysis && (
                                <div className="bg-gradient-to-br from-indigo-950/30 to-slate-950 border border-indigo-500/30 rounded-2xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                        <Brain size={150} />
                                    </div>

                                    <h3 className="flex items-center text-xl font-bold text-white mb-6">
                                        <Sparkles className="mr-2 text-indigo-400" size={24} />
                                        Causal Reflection
                                    </h3>

                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <h4 className="text-indigo-300 font-semibold mb-2">Connecting the Dots</h4>
                                            <p className="text-slate-300 leading-relaxed">
                                                {decision.outcomeAnalysis.causalReflection}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/50">
                                                <h4 className="text-red-400 font-semibold mb-2 text-sm uppercase">Bias Validation</h4>
                                                <p className="text-slate-400 text-sm">
                                                    {decision.outcomeAnalysis.biasValidation}
                                                </p>
                                            </div>
                                            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/50">
                                                <h4 className="text-emerald-400 font-semibold mb-2 text-sm uppercase">Key Learning</h4>
                                                <p className="text-slate-400 text-sm">
                                                    {decision.outcomeAnalysis.learningPoint}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                                            <span className="text-slate-400 text-sm">Updated Clarity Score based on hindsight:</span>
                                            <span className={`text-xl font-bold ${getScoreColor(decision.outcomeAnalysis.updatedClarityScore)}`}>
                                                {decision.outcomeAnalysis.updatedClarityScore}/100
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
}

export default DecisionDetail;