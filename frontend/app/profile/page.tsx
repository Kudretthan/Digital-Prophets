"use client";
import { User, Shield, Trophy, History, ArrowLeft, Hexagon, Activity, Copy, Check, Edit3, Zap, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import ProfileEditModal from "@/components/ProfileEditModal";
import { supabase } from "@/lib/supabase";

// Avatar Seçenekleri (Modal ile aynı olmalı)
const AVATAR_OPTIONS = [
    { id: '1', color: 'bg-red-500', icon: Zap, borderColor: 'border-red-500' },
    { id: '2', color: 'bg-purple-500', icon: LayoutGrid, borderColor: 'border-purple-500' },
    { id: '3', color: 'bg-yellow-500', icon: User, borderColor: 'border-yellow-500' },
    { id: '4', color: 'bg-cyan-500', icon: Zap, borderColor: 'border-cyan-500' },
    { id: '5', color: 'bg-pink-500', icon: LayoutGrid, borderColor: 'border-pink-500' },
    { id: '6', color: 'bg-green-500', icon: User, borderColor: 'border-green-500' },
];

export default function ProfilePage() {
  const [address, setAddress] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  const [username, setUsername] = useState("Anon_Analyst");
  const [avatarId, setAvatarId] = useState('3');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Avatar ID'yi objeye çevirir
  const currentAvatar = useMemo(() => AVATAR_OPTIONS.find(a => a.id === avatarId) || AVATAR_OPTIONS[2], [avatarId]);

  // 1. Sayfa Yüklendiğinde Adresi Çek (SDK ile sessiz kontrol)
  useEffect(() => {
    const init = async () => {
      let currentAddress = "";

      // SDK'yı çağırıyoruz
      try {
        const freighter = await import("@stellar/freighter-api");
        
        // SADECE izin verilmişse adresi al (getAddress)
        if (await freighter.isAllowed()) {
          const addressObj = await freighter.getAddress();

          if (addressObj.address) {
            currentAddress = addressObj.address;
            setAddress(currentAddress);
          }
        }
      } catch (e) {
        console.log("Cüzdan kontrolü beklemede...");
      }

      // Adres bulunduysa, profili çek
      if (currentAddress) {
        fetchProfile(currentAddress);
      }
    };
    init();
  }, []);

  // Veritabanından Profili Çekme Fonksiyonu
  const fetchProfile = async (walletAddr: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddr)
      .single();

    if (data) {
      setUsername(data.username);
      if (data.bio) setAvatarId(data.bio); 
    }
  };

  // 2. PROFİLİ KAYDETME FONKSİYONU (Robust Kontrol)
  const saveProfile = async (newName: string, newAvatarId: string) => {
    let targetAddress = address;

    // EĞER ADRES YOKSA, KULLANICIYI BAĞLANTIYA ZORLA (requestAccess)
    if (!targetAddress) {
      try {
        const freighter = await import("@stellar/freighter-api");
        // requestAccess, izin isteme penceresini açar
        const accessObj = await freighter.requestAccess(); 

        if (accessObj.error) {
          alert("Erişim reddedildi: " + accessObj.error);
          return;
        }
        
        targetAddress = accessObj.address;
        setAddress(targetAddress);
      } catch (e) {
        alert("Bağlantı hatası: Lütfen cüzdanınızın açık olduğundan emin olun.");
        return;
      }
    }

    // Supabase'e Yaz
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        wallet_address: targetAddress, 
        username: newName, 
        bio: newAvatarId 
      });

    if (error) {
      console.error("Veritabanı Hata:", error);
      alert("Kaydedilemedi: " + error.message);
    }

    // Ekranda güncelle
    setUsername(newName);
    setAvatarId(newAvatarId);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortAddress = (addr: string) => {
    if (!addr) return "GUEST_USER";
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const RankIcon = currentAvatar.icon;

  return (
    <main className="min-h-screen bg-cyber-black text-white font-mono p-4 md:p-8 relative overflow-hidden">
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      
      <div className="relative z-10 mb-6">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-cyber-green transition-colors w-fit">
          <ArrowLeft size={20} />
          <span>TERMINAL_DASHBOARD</span>
        </Link>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: KİMLİK KARTI */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-cyber-dark border border-cyber-gray p-6 relative overflow-hidden group">
            {/* Düzenle Butonu */}
            <button 
              onClick={() => setIsEditOpen(true)}
              className="absolute top-0 left-0 bg-cyber-gray/30 px-2 py-1 text-[9px] text-gray-400 border-r border-b border-cyber-gray/50 hover:bg-cyber-green hover:text-black transition-colors flex items-center gap-1 z-20"
            >
              <Edit3 size={10} /> DÜZENLE
            </button>

            {/* Kopyala Butonu */}
            <div 
              onClick={copyAddress}
              className="absolute top-0 right-0 bg-cyber-blue/10 px-2 py-1 text-[9px] text-cyber-blue border-l border-b border-cyber-blue/30 cursor-pointer hover:bg-cyber-blue hover:text-black transition-colors flex items-center gap-1"
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {address ? "ADRESİ KOPYALA" : "BAĞLANIYOR..."}
            </div>
            
            <div className="flex flex-col items-center text-center mt-4">
              
              {/* DİNAMİK AVATAR GÖRÜNTÜSÜ */}
              <div className={`w-24 h-24 rounded-full border-2 border-cyber-green mb-4 flex items-center justify-center relative overflow-hidden ${currentAvatar.color}`}>
                <RankIcon size={40} className="text-black relative z-10" />
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-cyber-black ${address ? "bg-cyber-green shadow-[0_0_10px_#00FF41]" : "bg-gray-500"}`}></div>
              </div>
              
              {/* DİNAMİK İSİM ALANI */}
              <h1 className="text-xl font-bold text-white mb-1 break-all px-2">
                {username}
              </h1>
              
              {/* SABİT UNVAN ALANI */}
              <div className="text-cyber-green text-xs tracking-widest mb-2 border border-cyber-green/30 px-2 py-0.5 rounded bg-cyber-green/5 font-mono">
                Level 1: Stajer
              </div>

              <div className="text-[10px] text-gray-500 font-mono mb-4">
                {shortAddress(address)}
              </div>

              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-cyber-blue h-full w-[70%] shadow-[0_0_10px_#00F0FF]"></div>
              </div>
              <div className="w-full flex justify-between text-[10px] text-gray-500">
                <span>REP SCORE</span>
                <span>0 XP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cyber-dark border border-cyber-gray p-4 text-center">
              <div className="text-gray-500 text-[10px] mb-1">BAŞARI ORANI</div>
              <div className="text-2xl font-bold text-cyber-green">%0</div>
            </div>
             <div className="bg-cyber-dark border border-cyber-gray p-4 text-center">
              <div className="text-gray-500 text-[10px] mb-1">TOPLAM KAR</div>
              <div className="text-2xl font-bold text-cyber-blue">+0K</div>
            </div>
          </div>

          <div className="bg-cyber-dark border border-cyber-gray p-4">
            <h3 className="text-xs text-gray-400 mb-4 flex items-center gap-2">
              <Shield size={14} /> LİSANSLAR
            </h3>
            <div className="flex gap-3 flex-wrap">
              <div className="w-10 h-10 flex items-center justify-center bg-cyber-green/10 border border-cyber-green text-cyber-green rounded tooltip-trigger" title="Sniper">
                <Trophy size={18} />
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-cyber-blue/10 border border-cyber-blue text-cyber-blue rounded" title="Analyst">
                <Activity size={18} />
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-purple-500/10 border border-purple-500 text-purple-500 rounded" title="Beta Tester">
                <Hexagon size={18} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* SAĞ KOLON - Loglar */}
        <motion.div 
           initial={{ x: 50, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="lg:col-span-2"
        >
          <div className="bg-cyber-dark border border-cyber-gray min-h-[600px] flex flex-col">
            <div className="p-4 border-b border-cyber-gray flex justify-between items-center bg-cyber-black/50">
              <h3 className="text-sm text-cyber-blue flex items-center gap-2">
                <History size={16} /> BLOCKCHAIN LOGS
              </h3>
              <button className="text-[10px] border border-cyber-gray px-3 py-1 hover:bg-cyber-gray transition-colors">
                STELLAR EXPLORER ↗
              </button>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] text-gray-500 border-b border-cyber-gray/30">
                  <tr>
                    <th className="pb-3 pl-2">DURUM</th>
                    <th className="pb-3">PİYASA</th>
                    <th className="pb-3">TAHMİN</th>
                    <th className="pb-3">MİKTAR</th>
                    <th className="pb-3 text-right pr-2">TX HASH</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr className="border-b border-cyber-gray/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-2">
                      <span className="bg-cyber-green/10 text-cyber-green px-2 py-0.5 rounded text-[10px]">CONFIRMED</span>
                    </td>
                    <td className="py-4">LoL 14.5 Update</td>
                    <td className="py-4 text-gray-400">YES</td>
                    <td className="py-4">500 $GUESS</td>
                    <td className="py-4 text-right pr-2 text-gray-500 text-[10px]">0x8f...2a9</td>
                  </tr>
                </tbody>
              </table>
              {!address && (
                <div className="text-center py-10 text-gray-500 text-xs">
                  GEÇMİŞİ GÖRMEK İÇİN CÜZDANI BAĞLAYIN
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <ProfileEditModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        currentName={username}
        currentAvatarId={avatarId}
        onSave={saveProfile}
      />

    </main>
  );
}