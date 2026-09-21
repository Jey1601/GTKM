import React, { useState } from 'react';
import { X, User as UserIcon, Sparkles } from 'lucide-react';
import { User } from '../types';
import { saveCurrentUser } from '../services/gameService';
import { AvatarCanvas } from './AvatarCanvas';
import { sounds } from '../utils/audio';

interface ProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onProfileUpdated: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentUser,
  onClose,
  onProfileUpdated
}) => {
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const [name, setName] = useState(currentUser.name);

  const handleSaveAvatar = (newAvatarDataUrl: string) => {
    sounds.playSuccess();
    const updated: User = {
      ...currentUser,
      avatarDataUrl: newAvatarDataUrl
    };
    saveCurrentUser(updated);
    onProfileUpdated(updated);
    setIsEditingCanvas(false);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sounds.playSuccess();
    const updated: User = {
      ...currentUser,
      name: name.trim()
    };
    saveCurrentUser(updated);
    onProfileUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {isEditingCanvas ? (
        <div className="w-full max-w-xl max-h-[95vh] overflow-y-auto">
          <AvatarCanvas
            initialAvatar={currentUser.avatarDataUrl}
            onSave={handleSaveAvatar}
            onCancel={() => setIsEditingCanvas(false)}
            title="Rediseñar mi Avatar"
            subtitle="Dibuja nuevos detalles, cambia los colores o reinventa tu personaje"
          />
        </div>
      ) : (
        <div className="bg-[#1c1444] border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="relative inline-block mb-3">
              <img
                src={currentUser.avatarDataUrl}
                alt={currentUser.name}
                className="w-24 h-24 rounded-3xl object-cover bg-white border-4 border-[#ff007a] shadow-[0_0_20px_rgba(255,0,122,0.4)]"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-2xl font-black text-white">{currentUser.name}</h2>
            <p className="text-sm font-bold text-[#00d2ff]">@{currentUser.nickname}</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsEditingCanvas(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#ff007a] to-[#ff5900] text-white font-extrabold text-sm shadow-md hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Abrir Lienzo y Redibujar Avatar</span>
            </button>

            <form onSubmit={handleSaveName} className="space-y-3 pt-4 border-t border-white/10">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                  Nombre para mostrar
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#120e28] border border-purple-500/40 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff007a]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 text-xs font-bold transition"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition"
                >
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
