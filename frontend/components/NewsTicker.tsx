"use client";
import { AlertTriangle, Radio } from "lucide-react";

const NEWS = [
  "SON DAKİKA: Riot Games, LoL 14.5 yamasında kritik nişancı değişikliklerini doğruladı.",
  "PİYASA UYARISI: $GUESS token hacmi son 24 saatte %150 arttı.",
  "SİZINTI: GTA VI fragmanında gizli bir tarih bulundu, Reddit çalkalanıyor.",
  "ANALİZ: Valorant yeni ajanı 'Clove' meta dengelerini değiştirebilir.",
  "SİSTEM: Bakım çalışması bu gece 03:00'te yapılacak.",
];

export default function NewsTicker() {
  return (
    <div className="fixed bottom-0 left-0 w-full h-8 bg-[#00FF41] z-50 flex items-center border-t border-black font-mono text-xs font-bold overflow-hidden">
      
      {/* SOL ETİKET (SABİT) */}
      <div className="h-full bg-black text-[#00FF41] px-4 flex items-center gap-2 z-20 shrink-0 border-r border-[#00FF41]">
        <Radio size={14} className="animate-pulse" />
        <span>CANLI AKIŞ</span>
      </div>

      {/* KAYAN YAZI ALANI */}
      {/* Not: marquee etiketi React'te uyarı verebilir ama %100 çalışır ve görünür */}
      {/* @ts-ignore */}
      <marquee scrollamount="10" className="w-full text-black flex items-center h-full pt-1">
        <div className="flex gap-12">
          {NEWS.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <AlertTriangle size={12} />
              {item}
            </span>
          ))}
        </div>
      {/* @ts-ignore */}
      </marquee>
    </div>
  );
}