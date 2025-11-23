// components/FastResult.tsx
"use client";
import { X, Clock, Zap, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FastResultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Demo Verisi (Gerçek uygulamada API'dan veya Soroban'dan gelmeli)
const demoResults = [
  { id: 101, market: "GTA VI: Erteleme Gelecek mi?", side: "YES", entry: 50.00, result: "WIN", payout: 160.00 },
  { id: 102, market: "LoL: Jinx Nerf Etkisi", side: "NO", entry: 20.00, result: "LOSS", payout: -20.00 },
  { id: 103, market: "CS2: Major Turnuva Galibi", side: "YES", entry: 150.00, result: "PENDING", payout: 0.00 },
];

export default function FastResultModal({ isOpen, onClose }: FastResultModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl bg-cyber-dark border border-cyber-gray shadow-[0_0_50px_rgba(0,180,255,0.1)] overflow-hidden max-h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-cyber-gray bg-cyber-black/50 shrink-0">
            <h3 className="text-cyber-blue font-mono text-sm flex items-center gap-2">
              <Clock size={16} /> HIZLI SONUÇLAR VE GEÇMİŞ İŞLEMLER
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <div className="text-[10px] text-gray-500 mb-4">
                &gt; Recent market resolutions and bet statuses.
            </div>

            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-cyber-blue/30 text-cyber-blue/80 uppercase tracking-wider">
                  <th className="py-2 px-1">ID</th>
                  <th className="py-2 px-3">Piyasa</th>
                  <th className="py-2 px-3">Seçim</th>
                  <th className="py-2 px-3 text-right">Miktar (XLM)</th>
                  <th className="py-2 px-3 text-center">Durum</th>
                  <th className="py-2 px-3 text-right">Kazanç/Kayıp</th>
                </tr>
              </thead>
              <tbody>
                {demoResults.map((result) => (
                  <tr key={result.id} className="border-b border-cyber-gray/50 hover:bg-cyber-gray/10 transition-colors">
                    <td className="py-3 px-1 text-gray-500">{result.id}</td>
                    <td className="py-3 px-3 text-white max-w-[150px] truncate">{result.market}</td>
                    <td className={`py-3 px-3 font-bold ${result.side === 'YES' ? 'text-cyber-green' : 'text-cyber-red'}`}>{result.side}</td>
                    <td className="py-3 px-3 text-right">{result.entry.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        result.result === 'WIN' ? 'bg-cyber-green/20 text-cyber-green' :
                        result.result === 'LOSS' ? 'bg-cyber-red/20 text-cyber-red' :
                        'bg-cyber-blue/20 text-cyber-blue'
                      }`}>
                        {result.result}
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                        result.result === 'WIN' ? 'text-cyber-green' :
                        result.result === 'LOSS' ? 'text-cyber-red' :
                        'text-gray-400'
                    }`}>
                        {result.result === 'WIN' ? 
                            <span className="flex items-center justify-end">+{result.payout.toFixed(2)} <ArrowUpRight size={12}/></span> : 
                        result.result === 'LOSS' ? 
                            <span className="flex items-center justify-end">{result.payout.toFixed(2)} <ArrowDownRight size={12}/></span> : 
                        "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}