import React, { useState } from 'react';
import { Copy, Check, Play, UserPlus, Sparkles, Crown, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { Encuentro, User } from '../types';
import { startGame, addSampleBots } from '../services/gameService';
import { sounds } from '../utils/audio';

interface LobbyProps {
  encuentro: Encuentro;
  currentUser: User;
  onEncuentroUpdated: (updated: Encuentro) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  encuentro,
  currentUser,
  onEncuentroUpdated
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = encuentro.hostId === currentUser.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(encuentro.code);
    setCopied(true);
    sounds.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddBots = () => {
    sounds.playPop();
    const updated = addSampleBots(encuentro.id);
    if (updated) {
      sounds.playSuccess();
      onEncuentroUpdated(updated);
    }
  };

  const handleStartGame = () => {
    if (encuentro.players.length < 2) {
      sounds.playBuzzer();
      return;
    }
    sounds.playFanfare();
    const updated = startGame(encuentro.id);
    if (updated) {
      onEncuentroUpdated(updated);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Lobby Header Card */}
      <div className="bg-[#1b143f] border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center mb-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#ff007a]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#00d2ff]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-black uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4 text-pink-400" /> Sala de Encuentro
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
          {encuentro.title}
        </h1>
        <p className="text-sm text-purple-200/80 max-w-lg mx-auto mb-6">
          Comparte este código con tus amigos o familiares para que entren desde su teléfono o laptop.
        </p>

        {/* Big Code Pill */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-3 bg-[#120e28] border-2 border-[#ff007a] rounded-3xl shadow-[0_0_30px_rgba(255,0,122,0.3)] mb-6">
          <div className="px-6 py-2">
            <span className="text-xs font-extrabold uppercase text-purple-400 block">CÓDIGO DE ENCUENTRO</span>
            <span className="text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00d2ff] via-[#ffd60a] to-[#ff007a]">
              {encuentro.code}
            </span>
          </div>

          <button
            id="lobby-copy-code-btn"
            type="button"
            onClick={handleCopyCode}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#ff007a] to-[#ff5900] hover:opacity-90 active:scale-95 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-300" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Players Count Tag */}
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-purple-300">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>{encuentro.players.length} {encuentro.players.length === 1 ? 'jugador en la sala' : 'jugadores en la sala'}</span>
        </div>
      </div>

      {/* Players Mosaic Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>🎭 Participantes en el Lobby</span>
          </h2>

          {/* Quick Bot Fill for Instant Testing */}
          {encuentro.players.length < 4 && (
            <button
              id="btn-add-test-bots"
              type="button"
              onClick={handleAddBots}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-extrabold transition flex items-center gap-1.5 active:scale-95"
              title="Añade 3 amigos simulados con avatares para probar el juego de inmediato"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Añadir Amigos de Prueba</span>
            </button>
          )}
        </div>

        {/* Avatar Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {encuentro.players.map((player) => (
            <div
              key={player.id}
              className="bg-[#1a133f] border-2 border-purple-500/30 hover:border-pink-500/60 rounded-3xl p-4 text-center shadow-lg transition-all transform hover:-translate-y-1 relative group"
            >
              {/* Host Crown Badge */}
              {player.isHost && (
                <div className="absolute top-3 right-3 bg-amber-400 text-black p-1 rounded-full shadow-md" title="Anfitrión de la sala">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Bot badge */}
              {player.isBot && (
                <div className="absolute top-3 left-3 bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Bot
                </div>
              )}

              {/* Avatar Drawing */}
              <div className="w-24 h-24 mx-auto mb-3 relative">
                <img
                  src={player.avatarDataUrl}
                  alt={player.name}
                  className="w-full h-full object-cover rounded-2xl bg-white border-2 border-purple-300/40 shadow-md group-hover:scale-105 transition"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Name & Nickname */}
              <h3 className="text-base font-extrabold text-white truncate px-1">
                {player.name}
              </h3>
              <p className="text-xs text-pink-400 font-bold truncate">
                @{player.nickname}
              </p>

              <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-extrabold">
                ● Conectado
              </div>
            </div>
          ))}

          {/* Empty slot placeholder inviting more friends */}
          {encuentro.players.length < 6 && (
            <div className="border-2 border-dashed border-purple-500/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center text-purple-400/60">
              <span className="text-3xl mb-1">👋</span>
              <span className="text-xs font-bold text-purple-300">Esperando amigos...</span>
              <span className="text-[11px] text-purple-400/80 mt-1">Comparte el código <b className="text-[#00d2ff]">{encuentro.code}</b></span>
            </div>
          )}
        </div>
      </div>

      {/* Host Controls vs Waiting Message */}
      <div className="bg-[#140f30] border border-white/10 rounded-3xl p-6 text-center">
        {isHost ? (
          <div>
            {encuentro.players.length < 2 ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-amber-300 text-sm font-bold bg-amber-500/20 px-4 py-2 rounded-2xl">
                  <AlertCircle className="w-4 h-4" />
                  <span>Se necesitan al menos 2 jugadores para jugar. Invita a alguien o añade amigos de prueba.</span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddBots}
                    className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm shadow-lg transition inline-flex items-center gap-2 active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Añadir amigos simulados para probar ya</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  id="btn-start-game-host"
                  type="button"
                  onClick={handleStartGame}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff5900] to-[#ffd60a] hover:opacity-95 active:scale-95 text-white font-black text-lg shadow-[0_6px_30px_rgba(255,0,122,0.5)] transition inline-flex items-center gap-3 animate-pulse"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>¡INICIAR PARTIDA AHORA!</span>
                </button>
                <p className="text-xs text-purple-300">
                  Todos los jugadores pasarán a la pantalla de responder preguntas.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <RefreshCw className="w-6 h-6 text-pink-400 animate-spin" />
            <h3 className="text-lg font-black text-white">
              Esperando a que el anfitrión inicie la partida...
            </h3>
            <p className="text-xs text-purple-300">
              ¡Prepárate para responder preguntas y adivinar quién es quién!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
