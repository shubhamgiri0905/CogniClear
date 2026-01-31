import React, { useState, useEffect } from 'react';
import { Decision, DecisionStatus, Emotion } from '../../types';
import { ArrowRight, Sparkles, Loader2, Info, X, Check } from 'lucide-react';
import { analyzeDecision } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface DecisionFormProps {
  userId: string;
  onSave: (decision: Decision) => void;
  isOnboarding?: boolean;
}

const DecisionForm: React.FC<DecisionFormProps> = ({ userId, onSave, isOnboarding }) => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    context: '',
    emotions: [] as Emotion[],
    optionsInput: '',
  });

  // Auto-show and auto-hide tooltips during onboarding
  useEffect(() => {
    if (isOnboarding) {
      let targetField = '';
      if (step === 1) targetField = 'title';
      else if (step === 2) targetField = 'emotion';
      else if (step === 3) targetField = 'optionsInput';

      if (targetField) {
        setActiveTooltip(targetField);
        const timer = setTimeout(() => {
          setActiveTooltip(prev => prev === targetField ? null : prev);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [step, isOnboarding]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEmotion = (emo: Emotion) => {
    setFormData(prev => {
      const exists = prev.emotions.includes(emo);
      if (exists) {
        return { ...prev, emotions: prev.emotions.filter(e => e !== emo) };
      } else {
        return { ...prev, emotions: [...prev.emotions, emo] };
      }
    });
  };

  const handleComplete = async () => {
    setIsAnalyzing(true);
    const options = formData.optionsInput.split('\n').filter(o => o.trim().length > 0);
    const selectedEmotions = formData.emotions.length > 0 ? formData.emotions : [Emotion.NEUTRAL];

    try {
      const analysis = await analyzeDecision(
        formData.title,
        formData.description,
        formData.context,
        selectedEmotions,
        options.length > 0 ? options : ['Default Path']
      );

      const newDecision: Decision = {
        id: uuidv4(),
        userId: userId, // Link to user
        title: formData.title,
        description: formData.description,
        context: formData.context,
        emotions: selectedEmotions,
        optionsConsidered: options.length > 0 ? options : ['Default Path'],
        dateCreated: new Date().toISOString(),
        status: DecisionStatus.ANALYZED,
        analysis: analysis,
        tags: analysis.relatedTags || [],
      };

      onSave(newDecision);
    } catch (e) {
      alert("Failed to analyze decision. Check your connection or API key.");
      setIsAnalyzing(false);
    }
  };

  const StepIndicator = ({ num }: { num: number }) => (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step === num ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30' : step > num ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
      {step > num ? '✓' : num}
    </div>
  );

  const FormLabel = ({ id, label, helpText, className = "" }: { id: string, label: string, helpText: string, className?: string }) => (
    <div className={`flex items-center mb-2 relative ${className}`}>
      <span className="block text-sm font-medium text-indigo-400 uppercase tracking-wider mr-2">{label}</span>
      <button
        onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
        className="text-slate-600 hover:text-indigo-400 transition-colors p-1 rounded-full hover:bg-slate-900"
        title="Info"
      >
        <Info size={14} />
      </button>

      {activeTooltip === id && (
        <div className="absolute left-0 bottom-full mb-3 w-64 z-50 animate-fade-in-up">
          <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-xl border border-indigo-400 relative text-xs leading-relaxed">
            <div className="absolute left-3 -bottom-1.5 w-3 h-3 bg-indigo-600 transform rotate-45 border-b border-r border-indigo-400"></div>
            <div className="flex items-start gap-2">
              <p className="flex-1">{helpText}</p>
              <button onClick={() => setActiveTooltip(null)} className="text-indigo-200 hover:text-white">
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-100 mb-2">Introspecting...</h2>
          <p className="text-slate-400 max-w-md">The engine is building a mental map of your decision, checking for biases, and simulating outcomes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto relative">
      <div className="mb-8 flex items-center justify-between px-10">
        <StepIndicator num={1} />
        <div className="h-0.5 flex-1 mx-4 bg-slate-800" />
        <StepIndicator num={2} />
        <div className="h-0.5 flex-1 mx-4 bg-slate-800" />
        <StepIndicator num={3} />
      </div>

      <div className={`bg-slate-950 border rounded-2xl p-8 shadow-2xl transition-all ${isOnboarding ? 'border-indigo-500/50 shadow-indigo-900/20' : 'border-slate-800'}`}>
        {step === 1 && (
          <div className="space-y-6 animate-fade-in relative">
            <div className="relative">
              <FormLabel
                id="title"
                label="The Dilemma"
                helpText="Start small. What is the one core question keeping you up at night? Be specific."
              />
              <h2 className="text-2xl font-bold text-slate-100 mb-4">What needs to be decided?</h2>
              <input
                type="text"
                placeholder="e.g., Should I accept the job offer at the startup?"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <FormLabel
                id="description"
                label="Details & Context"
                helpText="Provide background information. Who is involved? What are the key constraints? The more context, the better the simulation."
              />
              <textarea
                rows={4}
                placeholder="Describe the situation. What are the stakes? Who is involved?"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 resize-none"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                disabled={!formData.title}
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next: Context</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="relative">
              <FormLabel
                id="emotion"
                label="Internal State"
                helpText="Your current mood acts as a filter. Select all that apply. Complex decisions often involve mixed emotions."
              />
              <h2 className="text-2xl font-bold text-slate-100 mb-4">How are you feeling right now?</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(Emotion).map((emo) => {
                  const isSelected = formData.emotions.includes(emo);
                  return (
                    <button
                      key={emo}
                      onClick={() => toggleEmotion(emo)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                    >
                      <span>{emo}</span>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <FormLabel
                id="context"
                label="Deeper Context (Optional)"
                helpText="Are there deadlines? Budget limits? Past failures influencing this? This helps identify specific biases."
              />
              <textarea
                rows={3}
                placeholder="Any external pressures? Time constraints? Past experiences influencing this?"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                value={formData.context}
                onChange={(e) => handleChange('context', e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 font-medium px-4">Back</button>
              <button
                disabled={formData.emotions.length === 0}
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next: Options</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="relative">
              <FormLabel
                id="optionsInput"
                label="The Paths"
                helpText="Try to list at least 3 distinct options. Binary 'Yes/No' choices often hide the best creative solutions."
              />
              <h2 className="text-2xl font-bold text-slate-100 mb-4">What options are you considering?</h2>

              <textarea
                rows={6}
                placeholder="- Accept the offer&#10;- Stay at current job&#10;- Negotiate for more equity"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none font-mono text-sm leading-relaxed"
                value={formData.optionsInput}
                onChange={(e) => handleChange('optionsInput', e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-4 items-center">
              <button onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-300 font-medium px-4">Back</button>
              <button
                onClick={handleComplete}
                className="group relative flex items-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-[1.02]"
              >
                <Sparkles size={20} className="text-yellow-300 group-hover:animate-pulse" />
                <span>Run Introspection Engine</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionForm;