import React, { useState } from 'react';
import { Sparkles, Volume2, VolumeX, Copy, Check, LogOut, Edit3, Users, RefreshCw } from 'lucide-react';
import { User, Encuentro } from '../types';
import { sounds } from '../utils/audio';
import { copyToClipboard } from '../utils/clipboard';

interface NavbarProps {
  currentUser: User | null;
  currentEncuentro: Encuentro | null;
  onEditAvatar: () => void;
  onLogout: () => void;
  onLeaveEncuentro?: () => void;
  onSyncEncuentro?: () => void;
  isSyncing?: boolean;
  onOpenHistory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentEncuentro,
  onEditAvatar,
  onLogout,
  onLeaveEncuentro,
  onSyncEncuentro,
  isSyncing = false,
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

  const handleCopyCode = async () => {
    if (!currentEncuentro) return;
    const ok = await copyToClipboard(currentEncuentro.code);
    if (ok) {
      setCopied(true);
      sounds.playSuccess();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="w-full bg-[#120e28]/95 backdrop-blur-md border-b border-purple-900/40 sticky top-0 z-40 px-2 sm:px-4 py-2 sm:py-3 pt-safe">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#ff007a] via-[#7928ca] to-[#00d2ff] p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#120e28] rounded-[10px] flex items-center justify-center">
              <span className="text-base sm:text-xl">🎭</span>
            </div>
          </div>
          <div className="truncate">
            <span className="text-sm sm:text-xl font-black tracking-tight text-white flex items-center gap-0.5 truncate">
              GetTo<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] to-[#00d2ff]">KnowMe</span>
            </span>
            <span className="hidden sm:block text-[10px] text-purple-300 font-semibold tracking-wide uppercase">
              Juego de fiesta entre amigos y familia
            </span>
          </div>
        </div>

        {/* Center: Current Room Badge (hidden on extra small screens to protect buttons, visible sm and up) */}
        {currentEncuentro && (
          <div className="hidden sm:flex items-center gap-2 bg-[#22184c] border border-[#ff007a]/40 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl shadow-inner shrink-0">
            <span className="text-xs font-bold text-purple-300 hidden md:inline">CÓDIGO:</span>
            <span className="text-sm sm:text-lg font-black tracking-widest text-[#00d2ff]">
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

        {/* Right: Sound toggle, Sync, Profile, Exit */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Manual Sync Button when inside a game */}
          {currentEncuentro && onSyncEncuentro && (
            <button
              id="nav-btn-sync"
              type="button"
              onClick={() => {
                sounds.playPop();
                onSyncEncuentro();
              }}
              disabled={isSyncing}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1 shrink-0"
              title="Sincronizar sala y datos en tiempo real"
              aria-label="Sincronizar sala"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-200' : ''}`} />
              <span className="hidden md:inline font-semibold">Actualizar</span>
            </button>
          )}

          {/* Audio toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-purple-200 shrink-0"
            title={soundActive ? 'Desactivar sonido' : 'Activar sonido'}
            aria-label="Alternar sonido"
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4 text-purple-400" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Historial Button */}
              {onOpenHistory && !currentEncuentro && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onOpenHistory();
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
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
                className="flex items-center gap-1 bg-[#231a52] hover:bg-[#2e236b] border border-purple-500/30 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full transition group shrink-0"
                title="Editar avatar o perfil"
              >
                <img
                  src={currentUser.avatarDataUrl}
                  alt={currentUser.nickname}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white object-cover border border-purple-300/40 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-extrabold text-white hidden md:block group-hover:text-pink-300 transition">
                  @{currentUser.nickname}
                </span>
                <Edit3 className="w-3 h-3 text-purple-400 group-hover:text-white transition hidden sm:block" />
              </button>

              {/* Botón Salir del Encuentro - SIEMPRE VISIBLE EN MÓVIL Y ESCRITORIO */}
              {currentEncuentro && onLeaveEncuentro ? (
                <button
                  id="nav-btn-leave-encuentro"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onLeaveEncuentro();
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-black shadow-md transition flex items-center gap-1 shrink-0"
                  title="Salir del encuentro al Dashboard"
                  aria-label="Salir del encuentro"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="inline font-black">Salir</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onLogout();
                  }}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-purple-300 transition shrink-0"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
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
