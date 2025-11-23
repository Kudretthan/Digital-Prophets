"use client";
import { useState, useEffect, useMemo } from "react";
import { LogIn, Loader2, AlertTriangle, User, Zap } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// --- PROPS TANIMI EKLENDİ ---
interface WalletButtonProps {
  publicKey: string;
  setPublicKey: (key: string) => void;
}

const AVATAR_OPTIONS = [
    { id: '1', color: 'bg-red-500', icon: Zap, borderColor: 'border-red-500' },
    { id: '2', color: 'bg-purple-500', icon: Zap, borderColor: 'border-purple-500' },
    { id: '3', color: 'bg-yellow-500', icon: User, borderColor: 'border-yellow-500' },
    { id: '4', color: 'bg-cyan-500', icon: Zap, borderColor: 'border-cyan-500' },
    { id: '5', color: 'bg-pink-500', icon: Zap, borderColor: 'border-pink-500' },
    { id: '6', color: 'bg-green-500', icon: User, borderColor: 'border-green-500' },
];

// Fonksiyon artık props alıyor
export default function WalletButton({ publicKey, setPublicKey }: WalletButtonProps) {
  // const [publicKey, setPublicKey] ... BU SATIR SİLİNDİ, YUKARIDAN GELİYOR.
  
  const [profileName, setProfileName] = useState("Anonim");
  const [avatarId, setAvatarId] = useState('3');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [stellarBalance, setStellarBalance] = useState<string>('0.000000');

  const currentAvatar = useMemo(() => AVATAR_OPTIONS.find(a => a.id === avatarId) || AVATAR_OPTIONS[2], [avatarId]);

  const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL
    ?? (process.env.NEXT_PUBLIC_USE_TESTNET === 'true' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org');

  // --- HELPER FONKSİYONLAR AYNI KALIYOR ---
  const fetchProfile = async (walletAddr: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username, bio')
      .eq('wallet_address', walletAddr)
      .single();

    if (data) {
      setProfileName(data.username);
      if (data.bio) setAvatarId(data.bio); 
    } else {
       setProfileName("Yeni Analist");
    }
  };

  const resolveFreighter = async () => {
    try {
      const mod = await import("@stellar/freighter-api");
      const api = (mod && (mod as any).default) ?? mod;
      const injected = (window as any).freighter;
      const raw = api && Object.keys(api).length ? api : injected;

      const adapter = {
        isConnected: async () => {
          if (!raw) return false;
          if (typeof raw.isConnected === "function") return raw.isConnected();
          if (typeof raw.isAllowed === "function") return raw.isAllowed();
          return Boolean(raw);
        },
        isAllowed: async () => {
          if (!raw) return false;
          if (typeof raw.isAllowed === "function") return raw.isAllowed();
          return true;
        },
        requestAccess: async () => {
          if (!raw) return { error: "not_found" };
          if (typeof raw.requestAccess === "function") return raw.requestAccess();
          if (typeof raw.connect === "function") return raw.connect();
          return { error: "no_request_api" };
        },
        getPublicKey: async () => {
          if (!raw) return null;
          if (typeof raw.getPublicKey === "function") return raw.getPublicKey();
          if (typeof raw.getAddress === "function") {
            const res = await raw.getAddress();
            return res?.address ?? null;
          }
          return raw.publicKey ?? null;
        },
        getAddressObj: async () => {
          if (!raw) return null;
          if (typeof raw.getAddress === "function") return raw.getAddress();
          if (typeof raw.getPublicKey === "function") {
            const pk = await raw.getPublicKey();
            return { address: pk };
          }
          return raw.address ? { address: raw.address } : null;
        }
      };
      return adapter;
    } catch (e) {
      const injected = (window as any).freighter;
      const raw = injected;
      return {
        isConnected: async () => (raw ? true : false),
        isAllowed: async () => true,
        requestAccess: async () => (raw?.requestAccess ? raw.requestAccess() : { error: "no_request_api" }),
        getPublicKey: async () => raw?.publicKey ?? null,
        getAddressObj: async () => raw ? { address: raw.publicKey ?? raw.address } : null
      };
    }
  };

  const fetchStellarBalance = async (key: string) => {
    const tryUrl = async (baseUrl: string) => {
      const base = baseUrl.replace(/\/+$/, "");
      const url = `${base}/accounts/${encodeURIComponent(key)}`;
      const res = await fetch(url);
      const body = res.ok ? await res.json() : await res.text();
      return { res, body };
    };

    try {
      const r1 = await tryUrl(HORIZON_URL);
      if (r1.res.ok) {
        const data = r1.body as any;
        const xlmBalance = data.balances?.find((b: any) => b.asset_type === 'native');
        if (xlmBalance && 'balance' in xlmBalance) {
          setStellarBalance(parseFloat(xlmBalance.balance).toFixed(6));
        }
        return;
      }
      if (r1.res.status === 404 && !HORIZON_URL.includes('testnet')) {
        const testnetUrl = 'https://horizon-testnet.stellar.org';
        const r2 = await tryUrl(testnetUrl);
        if (r2.res.ok) {
          const data = r2.body as any;
          const xlmBalance = data.balances?.find((b: any) => b.asset_type === 'native');
          if (xlmBalance && 'balance' in xlmBalance) {
            setStellarBalance(parseFloat(xlmBalance.balance).toFixed(6));
          }
          return;
        }
      }
      setStellarBalance('Hata');
    } catch (e) {
      console.error('Balance err:', e);
      setStellarBalance('Hata');
    }
  };

  // --- SESSİZ KONTROL (PARENT STATE'İ GÜNCELLİYOR) ---
  useEffect(() => {
    const checkPersistence = async () => {
      const wasConnected = localStorage.getItem("isWalletConnected") === "true";
      
      if (wasConnected) {
        try {
          const freighter = await resolveFreighter();
          
          if (await freighter.isConnected() && await freighter.isAllowed()) {
            const addressObj = await freighter.getAddressObj();

            if (addressObj?.address) {
                setPublicKey(addressObj.address); // <--- BURASI ARTIK PARENT STATE'İ TETİKLİYOR
                await fetchProfile(addressObj.address);
                await fetchStellarBalance(addressObj.address);
            }
          }
        } catch (e) {
          console.log("Persistence check failed", e);
        }
      }
    };
    setTimeout(checkPersistence, 1000);
  }, [setPublicKey]); // Dependency eklendi

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const freighter = await resolveFreighter();

      if (!(await freighter.isConnected())) {
        setIsLoading(false);
        const confirm = window.confirm("Freighter cüzdanı bulunamadı. Yüklemek ister misiniz?");
        if (confirm) window.open("https://www.freighter.app/", "_blank");
        return;
      }

      const accessObj = await freighter.requestAccess();

      if (accessObj?.error) {
        setError("Giriş Reddedildi");
      } else {
        const addr = accessObj.address ?? (await freighter.getPublicKey());
        if (addr) {
          setPublicKey(addr); // <--- PARENT UPDATE
          await fetchProfile(addr);
          await fetchStellarBalance(addr);
          setError("");
          localStorage.setItem("isWalletConnected", "true");
        } else {
          setError("Adres alınamadı");
        }
      }

    } catch (e: any) {
      console.error("SDK Hatası:", e);
      setError("Bağlantı Hatası");
    } finally {
      setIsLoading(false);
    }
  };

  const shortAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  if (!publicKey) {
    return (
      <div className="flex flex-col items-end">
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="group flex items-center gap-2 bg-white text-black border border-gray-300 px-4 py-2 text-xs font-bold font-mono hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin text-black" />
          ) : (
            <LogIn size={14} className="text-black" />
          )}
          {isLoading ? "PROFİL YÜKLENİYOR..." : "FREIGHTER İLE GİRİŞ YAP"}
        </button>
        
        {error && (
          <span className="text-[9px] text-cyber-red mt-1 flex items-center gap-1 animate-pulse">
            <AlertTriangle size={9} /> {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link href="/profile" className="group text-right cursor-pointer flex flex-col items-end">
      <div className="text-[10px] flex justify-end items-center gap-2 mb-1">
        <span className="text-white font-bold text-base group-hover:text-cyber-green transition-colors leading-none">{profileName}</span>
        <div className={`w-3 h-3 rounded-full ${currentAvatar.color} border border-white/50 shadow-md`}></div>
      </div>
      
      <div className="flex items-center gap-2 text-cyber-green font-bold font-mono text-xs border border-cyber-green/30 bg-cyber-green/5 px-3 py-1 rounded group-hover:border-cyber-green transition-all">
        <span className="w-1.5 h-1.5 bg-cyber-blue rounded-full animate-pulse shadow-[0_0_5px_#00F0FF]"></span>
        <span className="text-cyber-blue">{stellarBalance} XLM</span>
        <span className="text-white/60 text-[10px] ml-2">{publicKey ? shortAddress(publicKey) : ""}</span>
      </div>
    </Link>
  );
}