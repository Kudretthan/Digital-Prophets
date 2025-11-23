"use client";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

const data = [
  { subject: 'Win Rate', A: 120, B: 110, fullMark: 150 },
  { subject: 'Pick Rate', A: 98, B: 130, fullMark: 150 },
  { subject: 'Ban Rate', A: 86, B: 130, fullMark: 150 },
  { subject: 'Reddit Hype', A: 99, B: 100, fullMark: 150 },
  { subject: 'Pro Play', A: 85, B: 90, fullMark: 150 },
  { subject: 'Skin Sales', A: 65, B: 85, fullMark: 150 },
];

export default function SentimentChart() {
  return (
    <div className="w-full h-[250px] bg-cyber-black/30 border border-cyber-gray rounded relative">
      <div className="absolute top-2 left-2 text-[10px] text-cyber-blue font-mono z-10">
        &gt; SYSTEM_ANALYSIS_V2
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          
          {/* Mevcut Durum (Mavi) */}
          <Radar
            name="Mevcut Meta"
            dataKey="A"
            stroke="#00F0FF"
            strokeWidth={2}
            fill="#00F0FF"
            fillOpacity={0.2}
          />
          
          {/* Beklenti / Tahmin (Yeşil) */}
          <Radar
            name="Tahmin"
            dataKey="B"
            stroke="#00FF41"
            strokeWidth={2}
            fill="#00FF41"
            fillOpacity={0.2}
          />
          
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}