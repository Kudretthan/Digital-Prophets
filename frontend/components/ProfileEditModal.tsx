"use client";
import { X, Save, User, FileText, Loader2, Zap, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Avatar Seçeneklerimiz: Renk ID'leri
const AVATAR_OPTIONS = [
    { id: '1', color: 'bg-red-500', icon: Zap, borderColor: 'border-red-500' },
    { id: '2', color: 'bg-purple-500', icon: LayoutGrid, borderColor: 'border-purple-500' },
    { id: '3', color: 'bg-yellow-500', icon: User, borderColor: 'border-yellow-500' },
    { id: '4', color: 'bg-cyan-500', icon: Zap, borderColor: 'border-cyan-500' },
    { id: '5', color: 'bg-pink-500', icon: LayoutGrid, borderColor: 'border-pink-500' },
    { id: '6', color: 'bg-green-500', icon: User, borderColor: 'border-green-500' },
];

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatarId: string; // Yeni: Artık 'bio' yerine 'avatarId' alacağız
  onSave: (name: string, avatarId: string) => void;
}

export default function ProfileEditModal({ isOpen, onClose, currentName, currentAvatarId, onSave }: ProfileEditModalProps) {
  const [name, setName] = useState(currentName);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarId);
  const [isSaving, setIsSaving] = useState(false);

  // Modal açıldığında mevcut verileri doldur
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setSelectedAvatar(currentAvatarId);
    }
  }, [isOpen, currentName, currentAvatarId]);

  const handleSave = () => {
    setIsSaving(true);
    // Veritabanı kaydetme simülasyonu
    setTimeout(() => {
      onSave(name, selectedAvatar);
      setIsSaving(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Arka Plan */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Pencere */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-cyber-dark border border-cyber-green shadow-[0_0_30px_rgba(0,255,65,0.15)] overflow-hidden"
        >
          {/* Başlık */}
          <div className="flex items-center justify-between p-4 border-b border-cyber-gray bg-cyber-black/80">
            <h3 className="text-cyber-green font-mono text-sm flex items-center gap-2">
              <User size={16} /> KİMLİK GÜNCELLEME
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* İsim Girişi */}
            <div className="space-y-2">
              <label className="text-[10px] text-cyber-blue font-mono block">KOD ADI (USERNAME)</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-cyber-gray p-3 pl-10 text-white font-mono focus:border-cyber-green focus:outline-none transition-all text-sm"
                  placeholder="Örn: Cipher_King"
                  maxLength={15}
                />
                <User size={16} className="absolute left-3 top-3 text-gray-500" />
              </div>
            </div>

            {/* AVATAR SEÇİM ALANI (Unvan Yerine) */}
            <div className="space-y-3">
              <label className="text-[10px] text-cyber-blue font-mono block">AVATAR PROTOKOLÜ SEÇ</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map(avatar => (
                  <div
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center p-1 cursor-pointer transition-all ${avatar.color}
                      ${selectedAvatar === avatar.id 
                        ? `border-4 ${avatar.borderColor} ring-2 ring-offset-1 ring-offset-cyber-dark ring-white/50 shadow-lg` 
                        : 'border-2 border-transparent opacity-70 hover:opacity-100'
                      }`}
                  >
                    <avatar.icon size={20} className="text-black" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-[10px] text-gray-500 font-mono pt-2">
                *Unvanınız (Level) otomatik olarak REP Puanınıza göre güncellenecektir.
            </div>

            {/* Kaydet Butonu */}
            <button 
              onClick={handleSave}
              disabled={isSaving || !name}
              className="w-full bg-cyber-green text-black font-bold py-3 hover:bg-[#33ff66] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? "SİSTEME İŞLENİYOR..." : "PROFİLİ GÜNCELLE"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}