"use client";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface MarketCardProps {
  title: string;
  category: string;
  odds: number;
  trend: "UP" | "DOWN";
  volume: string;
}

export default function MarketCard({ title, category, odds, trend, volume }: MarketCardProps) {
  const isUp = trend === "UP";

  return (
    <motion.div 
      whileHover={{ scale: 1.02, borderColor: isUp ? "#00FF41" : "#FF003C" }}
      className="group relative p-4 border border-cyber-gray bg-cyber-dark/80 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden"
    >
      {/* Sol Kenar Çubuğu (Durum Göstergesi) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isUp ? "bg-cyber-green" : "bg-cyber-red"} transition-all group-hover:w-2`} />

      {/* Arka plan ızgara efekti */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <div className="relative z-10 flex justify-between items-start mb-2">
        <div>
          <span className="text-[10px] font-mono text-cyber-blue uppercase tracking-widest bg-cyber-blue/10 px-1 py-0.5 rounded">[ {category} ]</span>
          <h3 className="text-sm font-bold mt-2 text-gray-100 group-hover:text-white font-mono tracking-tight">{title}</h3>
        </div>
        {isUp ? (
          <div className="bg-cyber-green/10 p-1 rounded">
            <ArrowUpRight className="text-cyber-green animate-pulse" size={20} />
          </div>
        ) : (
           <div className="bg-cyber-red/10 p-1 rounded">
            <ArrowDownRight className="text-cyber-red" size={20} />
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-end justify-between mt-6 border-t border-cyber-gray/50 pt-2">
        <div className="flex flex-col">
          <span className="text-[9px] text-gray-500 font-mono">24H HACİM</span>
          <div className="flex items-center gap-1">
            <Activity size={12} className="text-cyber-blue" />
            <span className="text-xs font-mono text-gray-300">{volume}</span>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-[9px] text-gray-500 block font-mono">GÜNCEL ORAN</span>
          <span className={`text-xl font-bold font-mono ${isUp ? "text-cyber-green drop-shadow-[0_0_3px_rgba(0,255,65,0.5)]" : "text-cyber-red drop-shadow-[0_0_3px_rgba(255,0,60,0.5)]"}`}>
            x{odds.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}