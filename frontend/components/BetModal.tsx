"use client";
import { X, TrendingUp, AlertTriangle, Check, Loader2, Lock, BarChart2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
// import SentimentChart from "./SentimentChart"; 
import { supabase } from "@/lib/supabase"; 
import { signTransaction } from "@stellar/freighter-api"; 
import { 
  rpc as StellarRpc, 
  TransactionBuilder, 
  Networks, 
  Contract, 
  Address, 
  nativeToScVal, 
  Transaction,
  BASE_FEE,
} from "@stellar/stellar-sdk";

// --- AYARLAR ---
const CONTRACT_ID = "CA6UOV32IZJJSIZH2DXW6E7SJFBGF7O3VY2WONZJMOQHHIT5GVH6S4PH";
const RPC_URL = "https://soroban-testnet.stellar.org";

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  odds: number;
  marketId: number | null;
  userPublicKey: string | null; 
}

type TransactionStatus = "IDLE" | "PROCESSING" | "SUCCESS" | "DB_ERROR" | "TX_ERROR";
type Tab = "ORDER" | "ANALYSIS"; 

export default function BetModal({ isOpen, onClose, title, odds, marketId, userPublicKey }: BetModalProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [status, setStatus] = useState<TransactionStatus>("IDLE");
  const [activeTab, setActiveTab] = useState<Tab>("ORDER");
  const [stellarBalance, setStellarBalance] = useState('0.000000');
  
  const currentMultiplier = (amount as number) * odds;

  // Bakiye Yetersiz mi Kontrolü
  const isInsufficientBalance = amount !== "" && Number(amount) > Number(stellarBalance);

  const fetchStellarBalance = async (key: string) => {
    try {
        const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${key}`);
        if(response.ok) {
            const data = await response.json();
            const native = data.balances.find((b: any) => b.asset_type === 'native');
            if(native) setStellarBalance(parseFloat(native.balance).toFixed(2));
        }
    } catch(e) { console.log("Bakiye hatasi:", e); }
  };

  useEffect(() => {
    if (isOpen) {
      setStatus("IDLE");
      setAmount("");
      setActiveTab("ORDER");
    }
    if (userPublicKey) {
        fetchStellarBalance(userPublicKey);
    }
  }, [isOpen, userPublicKey]); 

  // --- ANA İŞLEM: BAHİS YAPMA ---
  const handleConfirm = async () => {
    if (!amount || amount <= 0 || !marketId) {
        alert("Lütfen geçerli bir miktar girin.");
        return;
    }
    
    if (Number(amount) > Number(stellarBalance)) {
        alert("Yetersiz Bakiye!");
        return;
    }

    if (!userPublicKey) {
      alert("Cüzdan bağlantısı gerekli.");
      return;
    }

    setStatus("PROCESSING");

    try {
        console.log("1. İşlem Hazırlanıyor...");
        const server = new StellarRpc.Server(RPC_URL);
        
        let sourceAccount;
        try {
          sourceAccount = await server.getAccount(userPublicKey);
        } catch (e) {
          throw new Error("Hesabınız Testnet'te bulunamadı. Friendbot kullanın.");
        }

        const amountBigInt = BigInt(Math.floor(Number(amount) * 10_000_000));
        const sideVal = side === "YES"; 

        const contract = new Contract(CONTRACT_ID);

        const args = [
            new Address(userPublicKey).toScVal(),
            nativeToScVal(Number(marketId), { type: "u64" }),
            nativeToScVal(amountBigInt, { type: "i128" }),
            nativeToScVal(sideVal, { type: "bool" }),
        ];

        // 1. Ham İşlem
        let tx = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE, 
            networkPassphrase: Networks.TESTNET,
        })
        .addOperation(contract.call("place_bet", ...args))
        .setTimeout(180) 
        .build();

        // 2. SİMÜLASYON (Prepare)
        console.log("2. İşlem Simüle Ediliyor...");
        const preparedTx = await server.prepareTransaction(tx);

        // 3. İmzala
        console.log("3. İmza Bekleniyor...");
        const xdr = preparedTx.toXDR();
        const signedTx = await signTransaction(xdr, { 
            networkPassphrase: Networks.TESTNET 
        });

        if (signedTx.error) {
            console.error("İmza Hatası:", signedTx.error);
            throw new Error("İmza reddedildi.");
        }

        // 4. Gönder
        console.log("4. Ağa Gönderiliyor...");
        // @ts-ignore - SDK tip hatasını susturmak için
        const transactionToSubmit = TransactionBuilder.fromXDR(
            signedTx.signedTxXdr, 
            Networks.TESTNET
        ) as Transaction;
        
        const response = await server.sendTransaction(transactionToSubmit);

        if (response.status === "ERROR" || response.status === "TRY_AGAIN_LATER") {
            console.error("Gönderim Hatası (Ham):", response);
            const errorResponse = response as any;
            if (errorResponse.errorResultXdr) {
               console.error("Error XDR Detayı:", errorResponse.errorResultXdr);
            }
            throw new Error(`İşlem ağ tarafından reddedildi. Status: ${response.status}`);
        }

        const txHash = response.hash;
        console.log("5. İşlem Gönderildi. Hash:", txHash);

        // 6. Sonuç Bekle (Polling)
        let txResult = null;
        let attempts = 0;
        
        while (attempts < 20) { 
             await new Promise(resolve => setTimeout(resolve, 1000));
             const lookup = await server.getTransaction(txHash);
             
             if (lookup.status === "SUCCESS") {
                 txResult = lookup;
                 break;
             } else if (lookup.status === "FAILED") {
                 console.error("TX Failed on Ledger:", lookup);
                 throw new Error("İşlem ağda başarısız oldu (Hata loglarına bakınız).");
             }
             attempts++;
        }

        if (!txResult) throw new Error("İşlem zaman aşımına uğradı.");

        console.log("6. Başarılı!");

        await supabase
          .from('bets')
          .insert({
            wallet_address: userPublicKey,
            market_id: marketId,
            amount: amount,
            side: side,
            tx_hash: txHash
          });

        setStatus("SUCCESS");
        setTimeout(() => fetchStellarBalance(userPublicKey), 2000); 
        setTimeout(onClose, 3500); 

    } catch (e: any) {
      console.error("Süreç Hatası:", e);
      setStatus("TX_ERROR"); 
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={status !== 'PROCESSING' ? onClose : undefined} 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-cyber-dark border border-cyber-gray shadow-[0_0_50px_rgba(0,255,65,0.1)] overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-cyber-gray bg-cyber-black/50 shrink-0">
            <h3 className="text-cyber-green font-mono text-sm flex items-center gap-2">
              {status === "SUCCESS" ? <Check size={16}/> : status === "TX_ERROR" ? <AlertTriangle size={16}/> : <Zap size={16} />} 
              {status === "SUCCESS" ? "İŞLEM ONAYLANDI" : status === "TX_ERROR" ? "AĞ HATASI" : "İŞLEM TERMİNALİ"}
            </h3>
            <button onClick={status !== 'PROCESSING' ? onClose : undefined} className="text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {status !== "SUCCESS" && status !== "DB_ERROR" && status !== "TX_ERROR" && status !== "PROCESSING" && (
            <div className="grid grid-cols-2 border-b border-cyber-gray">
              <button 
                onClick={() => setActiveTab("ORDER")}
                className={`p-3 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "ORDER" ? "bg-cyber-green/10 text-cyber-green border-b-2 border-cyber-green" : "text-gray-500 hover:text-white"
                }`}
              >
                <TrendingUp size={14} /> EMİR GİRİŞİ
              </button>
              <button 
                onClick={() => setActiveTab("ANALYSIS")}
                className={`p-3 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "ANALYSIS" ? "bg-cyber-blue/10 text-cyber-blue border-b-2 border-cyber-blue" : "text-gray-500 hover:text-white"
                }`}
              >
                <BarChart2 size={14} /> ANALİZ VERİSİ
              </button>
            </div>
          )}

          <div className="p-6 overflow-y-auto">
            {status === "IDLE" && activeTab === "ORDER" && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {!userPublicKey && (
                    <div className="p-3 bg-cyber-red/10 border border-cyber-red text-[11px] font-mono flex items-center gap-2">
                        <AlertTriangle size={14}/> CÜZDAN GEREKLİ: Lütfen önce cüzdanınızı bağlayın!
                    </div>
                )}

                <div>
                  <label className="text-[10px] text-gray-500 font-mono block mb-1">HEDEF PİYASA ({marketId})</label>
                  <div className="text-white font-bold text-lg leading-tight">{title}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSide("YES")}
                    className={`p-3 border text-sm font-bold transition-all ${
                      side === "YES"
                        ? "border-cyber-green bg-cyber-green/10 text-cyber-green shadow-[0_0_15px_rgba(0,255,65,0.2)]"
                        : "border-cyber-gray text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    YÜKSELİR (YES)
                  </button>
                  <button
                    onClick={() => setSide("NO")}
                    className={`p-3 border text-sm font-bold transition-all ${
                      side === "NO"
                        ? "border-cyber-red bg-cyber-red/10 text-cyber-red shadow-[0_0_15px_rgba(255,0,60,0.2)]"
                        : "border-cyber-gray text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    DÜŞER (NO)
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-mono block mb-2 flex justify-between">
                    <span>YATIRIM MİKTARI ($XLM)</span>
                    <span className={`${isInsufficientBalance ? "text-cyber-red animate-pulse" : "text-cyber-blue"}`}>
                        BAKİYE: {stellarBalance} XLM
                    </span> 
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className={`w-full bg-black border p-3 pl-4 pr-16 text-white font-mono focus:outline-none transition-all ${
                          isInsufficientBalance ? "border-cyber-red focus:border-cyber-red" : "border-cyber-gray focus:border-cyber-blue"
                      }`}
                      placeholder="50.00"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-500">XLM</span>
                  </div>
                  {isInsufficientBalance && (
                      <span className="text-[9px] text-cyber-red font-mono block mt-1">
                          ⚠️ YETERSİZ BAKİYE (En fazla {stellarBalance} XLM girebilirsiniz)
                      </span>
                  )}
                </div>

                <div className="bg-cyber-gray/30 p-3 rounded border border-cyber-gray/50 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Tahmini Kazanç:</span>
                  <span className="text-xl font-bold text-cyber-green font-mono">
                    {amount ? currentMultiplier.toFixed(2) : "0.00"} <span className="text-xs text-gray-500">XLM</span>
                  </span>
                </div>

                <button 
                  onClick={handleConfirm}
                  disabled={!amount || !userPublicKey || isInsufficientBalance} 
                  className="w-full bg-cyber-green disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 hover:bg-[#33ff66] transition-colors flex items-center justify-center gap-2"
                >
                  <Lock size={16} /> EMRİ ONAYLA
                </button>
              </motion.div>
            )}

            {status === "IDLE" && activeTab === "ANALYSIS" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="text-white font-bold text-lg leading-tight mb-2">{title}</div>
                <p className="text-xs text-gray-400 mb-4">
                  Yapay zeka ve topluluk verilerinin karşılaştırmalı analizi.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono">
                  <div className="bg-cyber-blue/10 p-2 rounded text-cyber-blue border border-cyber-blue/20">
                    <div>AI GÜVEN SKORU</div>
                    <div className="text-lg font-bold">%78.5</div>
                  </div>
                  <div className="bg-cyber-green/10 p-2 rounded text-cyber-green border border-cyber-green/20">
                    <div>TOPLULUK SKORU</div>
                    <div className="text-lg font-bold">%92.1</div>
                  </div>
                </div>
              </motion.div>
            )}

            {status === "PROCESSING" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center space-y-4 py-10">
                <div className="relative">
                   <div className="absolute inset-0 bg-cyber-green blur-xl opacity-20 animate-pulse" />
                   <Loader2 size={48} className="text-cyber-green animate-spin relative z-10" />
                </div>
                <div className="font-mono text-sm text-cyber-green animate-pulse">
                  &gt; İşlem simüle ediliyor...<br/>
                  &gt; Cüzdan onayı bekleniyor...
                </div>
              </motion.div>
            )}

            {status === "SUCCESS" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-cyber-green/10 rounded-full flex items-center justify-center border border-cyber-green shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                  <Check size={40} className="text-cyber-green" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">BAHİS ONAYLANDI</h4>
                  <p className="text-gray-400 text-xs">Bahsiniz Blockchain'e işlendi.</p>
                </div>
                <div className="w-full bg-black/50 border border-cyber-gray p-4 text-left font-mono text-[10px] text-gray-400 space-y-2">
                  <div className="flex justify-between"><span>DURUM:</span><span className="text-cyber-blue">AĞDA ONAYLANDI</span></div>
                  <div className="flex justify-between"><span>MİKTAR:</span><span className="text-white">{amount} XLM</span></div>
                </div>
                <button onClick={onClose} className="w-full border border-cyber-gray text-white py-2 hover:bg-cyber-gray transition-colors text-sm">PENCEREYİ KAPAT</button>
              </motion.div>
            )}

             {(status === "TX_ERROR" || status === "DB_ERROR") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-4">
                <AlertTriangle size={48} className="text-cyber-red mx-auto"/>
                <h4 className="text-xl font-bold text-white mb-1">İŞLEM BAŞARISIZ</h4>
                <p className="text-gray-400 text-xs font-mono">
                    {status === "TX_ERROR" ? "Bakiye yetersiz veya ağ hatası." : "Veritabanı hatası."}
                </p>
                <button onClick={() => setStatus("IDLE")} className="border border-cyber-gray text-white py-2 px-4 mt-4 hover:bg-cyber-gray transition-colors text-sm">
                  TEKRAR DENE
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}