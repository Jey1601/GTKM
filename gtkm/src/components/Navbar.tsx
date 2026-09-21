import React, { useState } from 'react';
import { Sparkles, Volume2, VolumeX, Copy, Check, LogOut, Edit3, Users } from 'lucide-react';
import { User, Encuentro } from '../types';
import { sounds } from '../utils/audio';

interface NavbarProps {
  currentUser: User | null;
  currentEncuentro: Encuentro | null;
  onEditAvatar: () => void;
  onLogout: () => void;
  onLeaveEncuentro?: () => void;
  onOpenHistory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentEncuentro,
  onEditAvatar,
  onLogout,
  onLeaveEncuentro,
  onOpenHistory,
}) => {
  const [copied, setCopied] = useState(false);
  const [soundActive, setSoundActive] = useState(sounds.enabled);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundActive(sounds.enabled);
    if (sounds.enabled) {
      sounds.playPop();
    }
  };

  const handleCopyCode = () => {
    if (!currentEncuentro) return;
    navigator.clipboard.writeText(currentEncuentro.code);
    setCopied(true);
    sounds.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-[#120e28]/90 backdrop-blur-md border-b border-purple-900/40 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#ff007a] via-[#7928ca] to-[#00d2ff] p-0.5 shadow-md flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-[#120e28] rounded-[10px] flex items-center justify-center">
              <span className="text-xl">🎭</span>
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-0.5">
              GetTo<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] to-[#00d2ff]">KnowMe</span>
            </span>
            <span className="hidden sm:block text-[10px] text-purple-300 font-semibold tracking-wide uppercase">
              Juego de fiesta entre amigos y familia
            </span>
          </div>
        </div>

        {/* Center: Current Room Badge if active */}
        {currentEncuentro && (
          <div className="flex items-center gap-2 bg-[#22184c] border border-[#ff007a]/40 px-3 py-1.5 rounded-2xl shadow-inner">
            <span className="text-xs font-bold text-purple-300 hidden md:inline">CÓDIGO:</span>
            <span className="text-base sm:text-lg font-black tracking-widest text-[#00d2ff]">
              {currentEncuentro.code}
            </span>
            <button
              id="nav-copy-code-btn"
              type="button"
              onClick={handleCopyCode}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-purple-200"
              title="Copiar código del encuentro"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center gap-1 pl-1 border-l border-white/10 text-xs font-bold text-pink-400">
              <Users className="w-3.5 h-3.5" />
              <span>{currentEncuentro.players.length}</span>
            </div>
          </div>
        )}

        {/* Right: Sound toggle & User controls */}
        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-purple-200"
            title={soundActive ? 'Desactivar sonido' : 'Activar sonido'}
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4 text-purple-400" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Historial Button */}
              {onOpenHistory && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onOpenHistory();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                  title="Ver Historial de Encuentros"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="hidden sm:inline">Historial</span>
                </button>
              )}

              {/* Profile Avatar Pill */}
              <button
                id="btn-edit-profile-nav"
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onEditAvatar();
                }}
                className="flex items-center gap-2 bg-[#231a52] hover:bg-[#2e236b] border border-purple-500/30 pl-1.5 pr-3 py-1 rounded-full transition group"
                title="Editar avatar o perfil"
              >
                <img
                  src={currentUser.avatarDataUrl}
                  alt={currentUser.nickname}
                  className="w-7 h-7 rounded-full bg-white object-cover border border-purple-300/40"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left leading-tight hidden xs:block">
                  <span className="text-xs font-extrabold text-white block group-hover:text-pink-300 transition">
                    @{currentUser.nickname}
                  </span>
                </div>
                <Edit3 className="w-3 h-3 text-purple-400 group-hover:text-white transition" />
              </button>

              {/* Leave room or Logout */}
              {currentEncuentro && onLeaveEncuentro ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onLeaveEncuentro();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition flex items-center gap-1"
                  title="Salir del encuentro al Dashboard"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onLogout();
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-purple-300 transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
