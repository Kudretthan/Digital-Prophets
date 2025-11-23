"use client";
import MarketCard from "@/components/MarketCard";
import BetModal from "@/components/BetModal";
import WalletButton from "@/components/WalletButton";
import { Terminal, Radio, Cpu, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { isConnected, getPublicKey, isAllowed } from "@stellar/freighter-api"; // SDK'dan çektik

export default function Home() {
  // Merkezi State Tanımları
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [currentOdds, setCurrentOdds] = useState<number>(0);
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  
  const [publicKey, setPublicKey] = useState<string>(""); // <-- MERKEZİ PUBLIC KEY
  const [betHistory, setBetHistory] = useState<Array<{id: number; market: string; amount: number; odds: number; result: string; date: string}>>([]);
  
  // ÖNEMLİ: Sayfa açıldığında sessizce bağlanmayı dene (WalletButton'ın logic'i buraya taşındı)
  useEffect(() => {
    const checkPersistence = async () => {
        const wasConnected = localStorage.getItem("isWalletConnected") === "true";
        if (wasConnected) {
            try {
                if (await isConnected() && await isAllowed()) {
                    const key = await getPublicKey();
                    if (key) {
                        setPublicKey(key);
                        // Mock bahis geçmişi verilerini yükle
                        setBetHistory([
                            { id: 1, market: "LoL 14.5: Jinx Nerf", amount: 250, odds: 1.45, result: "WIN", date: "14:32:18" },
                            { id: 2, market: "Steam: Yaz İndirimi", amount: 500, odds: 1.15, result: "LOSS", date: "12:15:42" },
                            { id: 3, market: "Valorant: Ajan Rolü", amount: 175, odds: 2.10, result: "WIN", date: "10:48:56" },
                            { id: 4, market: "Elden Ring DLC", amount: 350, odds: 2.80, result: "PENDING", date: "09:21:33" },
                        ]);
                    }
                }
            } catch (e) {}
        }
    };
    setTimeout(checkPersistence, 1000);
  }, []);

  // Kapatma mantığı
  const handleCloseModal = () => {
    setSelectedMarket(null);
    setSelectedMarketId(null);
  };

  return (
    <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden h-screen bg-cyber-black text-white font-mono">
      
      {/* ÜST BAR (Header) */}
      <header className="flex justify-between items-center mb-6 border-b border-cyber-gray pb-4">
        
        {/* SOL TARAF: Logo ve Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-green/10 rounded border border-cyber-green/20">
             <Terminal className="text-cyber-green" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter leading-none">DIGITAL<span className="text-cyber-green">PROPHETS</span></h1>
            <span className="text-[10px] text-gray-500 tracking-[0.2em]">PREDICTION_MARKET_V1.0</span>
          </div>
        </div>

        {/* SAĞ TARAF: Cüzdan (Kontrolsüz Bileşen) */}
        <div className="flex items-center gap-6 text-xs">
          <div className="hidden md:flex items-center gap-2 text-cyber-green px-3 py-1 bg-cyber-green/5 border border-cyber-green/20 rounded-full">
            <Radio size={14} className="animate-pulse" />
            <span>SYSTEM_ONLINE</span>
          </div>
          
          {/* Cüzdan Butonu - State'i merkeze bağladık */}
          <WalletButton publicKey={publicKey} setPublicKey={setPublicKey} />
        </div>
      </header>

      {/* ANA İÇERİK IZGARASI */}
      <div className="grid grid-cols-12 gap-6 h-full pb-20">
        
        {/* SOL PANEL: Piyasa Listesi */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-cyber-blue flex items-center gap-2">
               <Cpu size={16} /> AKTİF PİYASALAR (LIVE)
            </h2>
            <div className="text-[10px] text-gray-500">LAST UPDATE: 14:02:59</div>
          </div>
          
          <div className="overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
            
            {/* Tüm kart onClick'leri (Market ID'leri atanmış) */}
            <div onClick={() => { setSelectedMarket("LoL 14.5: Jinx Nerf Etkisi"); setCurrentOdds(1.45); setSelectedMarketId(1); }}>
              <MarketCard title="LoL 14.5: Jinx Nerf Etkisi" category="MOBA / BALANCE" odds={1.45} trend="UP" volume="45,200" />
            </div>

            <div onClick={() => { setSelectedMarket("GTA VI: Erteleme Gelecek mi?"); setCurrentOdds(3.20); setSelectedMarketId(2); }}>
              <MarketCard title="GTA VI: Erteleme Gelecek mi?" category="INDUSTRY / NEWS" odds={3.20} trend="DOWN" volume="120,500" />
            </div>
             
            <div onClick={() => { setSelectedMarket("Valorant: Yeni Ajan Rolü?"); setCurrentOdds(2.10); setSelectedMarketId(3); }}>
              <MarketCard title="Valorant: Yeni Ajan Rolü?" category="FPS / META" odds={2.10} trend="UP" volume="12,800" />
            </div>
            
            <div onClick={() => { setSelectedMarket("CS2: Major Turnuva Galibi"); setCurrentOdds(5.50); setSelectedMarketId(4); }}>
              <MarketCard title="CS2: Major Turnuva Galibi" category="ESPORTS" odds={5.50} trend="DOWN" volume="8,900" />
            </div>

            <div onClick={() => { setSelectedMarket("Steam: Yaz İndirimi Tarihi"); setCurrentOdds(1.15); setSelectedMarketId(5); }}>
              <MarketCard title="Steam: Yaz İndirimi Tarihi" category="PLATFORM" odds={1.15} trend="UP" volume="92,100" />
            </div>

            <div onClick={() => { setSelectedMarket("Elden Ring DLC: Yeni Boss?"); setCurrentOdds(2.80); setSelectedMarketId(6); }}>
              <MarketCard title="Elden Ring DLC: Yeni Boss?" category="RPG / CONTENT" odds={2.80} trend="DOWN" volume="33,400" />
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: Yan Menü */}
        <div className="hidden md:flex col-span-4 lg:col-span-3 border-l border-cyber-gray pl-6 flex-col gap-6">
          <div className="bg-cyber-dark/50 border border-cyber-gray p-4 rounded-sm">
            <h3 className="text-xs text-cyber-blue mb-4 flex justify-between items-center border-b border-cyber-gray/50 pb-2">
              <span className="flex items-center gap-2"><BarChart3 size={14}/> TOP ANALISTS</span>
              <span className="text-[10px] text-gray-500">[24H]</span>
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between items-center">
                <span className="text-white flex items-center gap-2">
                  <span className="text-cyber-green text-[10px]">#1</span> Neo_Trader
                </span>
                <span className="text-cyber-green">+450 REP</span>
              </li>
            </ul>
          </div>
         {/* bahis geçmişi mock */}
          <div className="flex-1 bg-black border border-cyber-gray p-4 font-mono text-[10px] text-gray-500 overflow-hidden relative opacity-70">
            <div className="absolute inset-0 bg-cyber-green/5 pointer-events-none" />
            {!publicKey ? (
              <>
                <p>&gt; Connecting to node_1...</p>
                <p className="text-cyber-green">&gt; Connection established.</p>
              </>
            ) : (
              <>
                <p className="text-cyber-green">&gt; Wallet Connected: {publicKey.slice(0, 6)}...{publicKey.slice(-4)}</p>
                <p className="text-cyber-green">&gt; Fetching bet history...</p>
                <p className="text-cyber-green mt-2">&gt; [RECENT BETS]</p>
                {betHistory.map((bet) => (
                  <p key={bet.id} className={`pl-4 ${bet.result === 'WIN' ? 'text-green-400' : bet.result === 'LOSS' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {bet.date} | {bet.market} | {bet.amount} XLM @ {bet.odds} | {bet.result}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL PENCERESİ - PUBLIC KEY'İ GÖNDERDİK --- */}
      <BetModal 
        isOpen={!!selectedMarket} 
        onClose={handleCloseModal} 
        title={selectedMarket || ""} 
        odds={currentOdds}
        marketId={2}
        userPublicKey={publicKey} // <-- MODALA MERKEZİ KEY GİDİYOR
      />

    </main>
  );
}