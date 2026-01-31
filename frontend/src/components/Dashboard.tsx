import React, { useMemo, useState } from 'react';
import { Decision, Emotion } from '../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, AlertTriangle, Lightbulb, Target, Info } from 'lucide-react';
import DecisionGraph from './DecisionGraph';

interface DashboardProps {
    decisions: Decision[];
    patterns: any;
    onSelectDecision?: (id: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ decisions, patterns, onSelectDecision }) => {

    // Calculate average clarity score
    const avgClarity = useMemo(() => {
        if (decisions.length === 0) return 0;
        const total = decisions?.reduce((acc, curr) => acc + (curr.analysis?.clarityScore || 0), 0);
        return Math.round(total / decisions.length);
    }, [decisions]);

    // Aggregate Biases and calculate Percentages
    const biasData = useMemo(() => {
        const counts: Record<string, number> = {};
        let totalBiases = 0;

        decisions.forEach(d => {
            d.analysis?.biases.forEach(b => {
                counts[b.name] = (counts[b.name] || 0) + 1;
                totalBiases++;
            });
        });

        return Object.keys(counts).map(key => ({
            name: key,
            value: Math.round((counts[key] / totalBiases) * 100) // Convert to percentage
        })).slice(0, 5);
    }, [decisions]);

    // Emotional Radar Data
    const emotionData = useMemo(() => {
        const emos: Record<string, number> = {
            'Anxious': 0, 'Excited': 0, 'Confused': 0, 'Confident': 0, 'Pressure': 0
        };
        decisions.forEach(d => {
            // Handle both array and potential legacy string
            const decisionEmotions = Array.isArray(d.emotions) ? d.emotions : [(d as any).emotion as string];
            decisionEmotions.forEach(e => {
                if (e && e in emos) emos[e]++;
            });
        });
        return Object.keys(emos).map(k => ({ subject: k, A: emos[k], fullMark: decisions.length || 5 }));
    }, [decisions]);

    if (decisions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-slate-800 p-6 rounded-full">
                    <Activity className="w-12 h-12 text-slate-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-300">No decisions logged yet</h2>
                <p className="text-slate-500 max-w-sm">Start your introspection journey by adding a new decision.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Activity className="text-indigo-400" />}
                    label="Decisions Logged"
                    value={decisions.length.toString()}
                    subtext="Total lifetime"
                />
                <StatCard
                    icon={<Lightbulb className="text-yellow-400" />}
                    label="Avg Clarity Score"
                    value={`${avgClarity}%`}
                    subtext="Reasoning quality"
                    infoText="A score out of 100 indicating how logically sound and well-reasoned your decision process appeared to the AI."
                />
                <StatCard
                    icon={<AlertTriangle className="text-red-400" />}
                    label="Top Bias"
                    value={biasData[0]?.name || 'None'}
                    subtext="Most frequent trap"
                    infoText="The cognitive bias that appears most frequently in your decision history."
                />
                <StatCard
                    icon={<Target className="text-emerald-400" />}
                    label="Action Rate"
                    value={`${Math.round((decisions.filter(d => d.status === 'COMPLETED').length / decisions.length) * 100)}%`}
                    subtext="Decisions finalized"
                    infoText="The percentage of decisions where you have returned to log the final outcome, closing the introspection loop."
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Semantic Graph (Takes up full width on top of grid) */}
                <div className="lg:col-span-3">
                    <DecisionGraph decisions={decisions} onSelect={onSelectDecision || (() => { })} />
                </div>

                {/* Pattern Insight */}
                <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BrainCircuit size={120} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                        <SparklesIcon className="w-5 h-5 text-indigo-400 mr-2" />
                        AI Pattern Recognition
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Deep Insight</span>
                            <p className="text-slate-200 mt-2 leading-relaxed italic">"{patterns?.insight || 'Gathering more data to formulate insights...'}"</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Dominant Bias</span>
                                <p className="text-slate-300 mt-1">{patterns?.dominantBias || 'Analyzing...'}</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Recommendation</span>
                                <p className="text-slate-300 mt-1">{patterns?.recommendation || 'Continue logging.'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bias Distribution */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4">Cognitive Bias Distribution</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={biasData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ value }) => `${value}%`}
                                >
                                    {biasData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                    formatter={(value: number) => [`${value}%`, 'Frequency']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {biasData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center text-xs text-slate-400">
                                <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Emotion Radar */}
                <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                    <div className="w-full flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-300">Emotional Influence Map</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Visualize how different emotional states may be subtly shaping your decision landscape.
                            </p>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={emotionData}>
                                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                <Radar
                                    name="Influence"
                                    dataKey="A"
                                    stroke="#818cf8"
                                    strokeWidth={3}
                                    fill="#6366f1"
                                    fillOpacity={0.3}
                                    isAnimationActive={true}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }}
                                    itemStyle={{ color: '#818cf8' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, subtext, infoText }: { icon: React.ReactNode, label: string, value: string, subtext: string, infoText?: string }) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors relative group z-0">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-slate-400 text-sm font-medium">{label}</p>
                        {infoText && (
                            <div className="relative">
                                <button
                                    className="text-slate-600 hover:text-indigo-400 transition-colors"
                                    onClick={() => setShowInfo(!showInfo)}
                                    onMouseEnter={() => setShowInfo(true)}
                                    onMouseLeave={() => setShowInfo(false)}
                                >
                                    <Info size={14} />
                                </button>
                                {showInfo && (
                                    <div className="absolute left-0 top-full mt-2 w-48 z-50 animate-fade-in">
                                        <div className="bg-slate-800 text-slate-200 text-xs p-3 rounded-lg shadow-xl border border-slate-700">
                                            {infoText}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
                    <p className="text-slate-500 text-xs mt-1">{subtext}</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl">
                    {icon}
                </div>
            </div>
        </div>
    );
};

// Helper Icons locally
const BrainCircuit = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 3 2.5 2.5 0 0 0 0 4 2.5 2.5 0 0 0 1.32 3 2.5 2.5 0 0 0 1.98 3 2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 4.96.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-3 2.5 2.5 0 0 0 0-4 2.5 2.5 0 0 0-1.32-3 2.5 2.5 0 0 0-1.98-3 2.5 2.5 0 0 0-4.96.46Z" /><path d="M12 12h.01" /></svg>
);
const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" /></svg>
);

export default Dashboard;