import React from 'react';
import { Decision } from '../../types';
import { Calendar, ChevronRight } from 'lucide-react';

interface DecisionListProps {
  decisions: Decision[];
  onSelect: (id: string) => void;
}

const DecisionList: React.FC<DecisionListProps> = ({ decisions, onSelect }) => {
  if (decisions.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-950/50 rounded-3xl border border-dashed border-slate-800">
        <h3 className="text-slate-400 font-medium">No decisions recorded yet.</h3>
      </div>
    );
  }

  // Sort by date desc
  const sorted = [...decisions].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Decision Log</h2>
      <div className="grid gap-4">
        {sorted.map((decision) => {
          const displayEmotions = Array.isArray(decision.emotions) ? decision.emotions : [(decision as any).emotion as string];
          return (
            <div
              key={decision.id}
              onClick={() => onSelect(decision.id)}
              className="group bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-indigo-900/10"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {displayEmotions.map(e => (
                      <span key={e} className={`px-2 py-0.5 rounded text-xs font-medium border ${getEmotionColor(e)}`}>
                        {e}
                      </span>
                    ))}
                    <span className="text-slate-500 text-xs flex items-center ml-1">
                      <Calendar size={12} className="mr-1" />
                      {new Date(decision.dateCreated).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {decision.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                    {decision.description}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  {decision.analysis && (
                    <div className="flex items-center space-x-1" title="Clarity Score">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400">
                        {decision.analysis.clarityScore}
                      </div>
                    </div>
                  )}
                  <ChevronRight className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>

              {decision.analysis?.biases[0] && (
                <div className="mt-4 pt-4 border-t border-slate-900 flex items-center">
                  <span className="text-xs text-slate-500 mr-2">Top Detected Bias:</span>
                  <span className="text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded">
                    {decision.analysis.biases[0].name}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

const getEmotionColor = (emotion: string) => {
  switch (emotion) {
    case 'Anxious': return 'border-red-900 text-red-400 bg-red-900/20';
    case 'Excited': return 'border-emerald-900 text-emerald-400 bg-emerald-900/20';
    case 'Confused': return 'border-orange-900 text-orange-400 bg-orange-900/20';
    case 'Confident': return 'border-blue-900 text-blue-400 bg-blue-900/20';
    default: return 'border-slate-700 text-slate-400 bg-slate-800/50';
  }
}

export default DecisionList;