import React, { useMemo } from 'react';
import { Decision, Emotion } from '../../types';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

interface DecisionGraphProps {
  decisions: Decision[];
  onSelect: (id: string) => void;
}

const DecisionGraph: React.FC<DecisionGraphProps> = ({ decisions, onSelect }) => {

  // Transform decisions into graph nodes
  const data = useMemo(() => {
    return decisions.map((d, i) => {
      // Logic to handle multiple emotions: Average the valence
      const emotions = Array.isArray(d.emotions) ? d.emotions : [(d as any).emotion as Emotion]; // Legacy support

      let totalX = 0;
      emotions.forEach(emo => {
        switch (emo) {
          case 'Anxious': totalX += -8; break;
          case 'Confused': totalX += -4; break;
          case 'Pressure': totalX += -6; break;
          case 'Neutral': totalX += 0; break;
          case 'Excited': totalX += 6; break;
          case 'Confident': totalX += 8; break;
        }
      });

      let xVal = emotions.length > 0 ? totalX / emotions.length : 0;

      // Add some random jitter so points don't overlap perfectly
      xVal += (Math.random() - 0.5) * 2;

      // Map Clarity to Y-axis (0-100)
      const yVal = d.analysis?.clarityScore || 50;

      return {
        id: d.id,
        x: xVal,
        y: yVal,
        z: 10, // Size
        title: d.title,
        emotions: emotions,
        tags: d.tags || [],
        bias: d.analysis?.biases[0]?.name || 'None'
      };
    });
  }, [decisions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs z-50">
          <p className="font-bold text-slate-100 mb-1">{data.title}</p>
          <div className="flex flex-wrap gap-1 mb-1">
            {data.emotions.map((e: string) => (
              <span key={e} className="text-[10px] uppercase text-indigo-400">{e}</span>
            ))}
          </div>
          <p className="text-emerald-400 mb-1">Clarity: {data.y}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {data.tags.slice(0, 3).map((t: string) => (
              <span key={t} className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">{t}</span>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const PulsingNode = (props: any) => {
    const { cx, cy, fill } = props;
    return (
      <g className="cursor-pointer">
        <circle cx={cx} cy={cy} r={6} fill={fill} stroke="white" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={6} fill="transparent" stroke={fill} strokeWidth={2}>
          <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    )
  }

  if (decisions.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-950 border border-slate-800 rounded-2xl border-dashed">
        <p className="text-slate-500 text-sm">Add more decisions to build your semantic graph.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Semantic Decision Map</h3>
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1" /> High Clarity</span>
          <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-indigo-500 mr-1" /> Balanced</span>
          <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1" /> Low Clarity</span>
        </div>
      </div>

      <div className="h-[400px] w-full bg-slate-900/30 rounded-xl relative">
        {/* Background Labels */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-slate-700 uppercase tracking-widest pointer-events-none">Rational / Clear</div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-slate-700 uppercase tracking-widest pointer-events-none">Uncertain / Foggy</div>
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs font-bold text-slate-700 uppercase tracking-widest pointer-events-none">Negative Emotion</div>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-xs font-bold text-slate-700 uppercase tracking-widest pointer-events-none">Positive Emotion</div>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" name="Emotion" domain={[-10, 10]} hide />
            <YAxis type="number" dataKey="y" name="Clarity" domain={[0, 100]} hide />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine y={50} stroke="#334155" strokeDasharray="3 3" />
            <ReferenceLine x={0} stroke="#334155" strokeDasharray="3 3" />
            <Scatter
              name="Decisions"
              data={data}
              onClick={(p) => onSelect(p.id)}
              className="cursor-pointer"
              shape={<PulsingNode />}
            >
              {data.map((entry, index) => {
                let fill = '#6366f1'; // Indigo (Medium)
                if (entry.y > 70) fill = '#10b981'; // Emerald (High)
                if (entry.y < 40) fill = '#ef4444'; // Red (Low)
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DecisionGraph;