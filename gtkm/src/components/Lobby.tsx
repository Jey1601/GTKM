import React, { useState } from 'react';
import { Copy, Check, Play, UserPlus, Sparkles, Crown, Users, RefreshCw, AlertCircle, Sliders, Link, Loader2 } from 'lucide-react';
import { Encuentro, User } from '../types';
import { startGame, addSampleBots, updateEncuentroSettings } from '../services/gameService';
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAddingBots, setIsAddingBots] = useState(false);
  const isHost = encuentro.hostId === currentUser.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(encuentro.code);
    setCopiedCode(true);
    sounds.playSuccess();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?code=${encuentro.code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    sounds.playSuccess();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddBots = async () => {
    setIsAddingBots(true);
    sounds.playPop();
    try {
      const updated = await addSampleBots(encuentro.id);
      if (updated) {
        sounds.playSuccess();
        onEncuentroUpdated(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingBots(false);
    }
  };

  const handleStartGame = async () => {
    if (encuentro.players.length < 2) {
      sounds.playBuzzer();
      return;
    }
    setIsStarting(true);
    sounds.playFanfare();
    try {
      const updated = await startGame(encuentro.id);
      if (updated) {
        onEncuentroUpdated(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
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
          Comparte este código o enlace directo con tus amigos para que entren desde cualquier dispositivo móvil o computadora.
        </p>

        {/* Big Code Pill and Action Buttons */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-3 bg-[#120e28] border-2 border-[#ff007a] rounded-3xl shadow-[0_0_30px_rgba(255,0,122,0.3)] mb-4">
          <div className="px-6 py-2">
            <span className="text-xs font-extrabold uppercase text-purple-400 block">CÓDIGO DE ENCUENTRO</span>
            <span className="text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00d2ff] via-[#ffd60a] to-[#ff007a]">
              {encuentro.code}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              id="lobby-copy-code-btn"
              type="button"
              onClick={handleCopyCode}
              className="px-4 py-3 rounded-2xl bg-[#ff007a] hover:bg-[#ff007a]/80 active:scale-95 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-green-300" />
                  <span>¡Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>

            <button
              id="lobby-copy-link-btn"
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 active:scale-95 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-green-300" />
                  <span>¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  <span>Copiar Enlace de Invitación</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Players Count & Game Settings Tag */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-purple-300">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{encuentro.players.length} {encuentro.players.length === 1 ? 'jugador en la sala' : 'jugadores en la sala'}</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5 text-pink-300 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 text-xs">
            <Sliders className="w-3.5 h-3.5 text-pink-400" />
            <span>Guess Who: {encuentro.guessWhoPercentage ?? 70}% al azar</span>
          </div>
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
            {/* Host In-Lobby Settings Adjustment */}
            <div className="mb-6 p-4 rounded-2xl bg-[#120e28] border border-purple-500/30 text-left max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-pink-400" />
                  <span>Configuración Guess Who para esta partida:</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-black text-xs border border-pink-500/30">
                  {encuentro.guessWhoPercentage ?? 70}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-purple-400">20%</span>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={encuentro.guessWhoPercentage ?? 70}
                    onChange={e => {
                      const val = Number(e.target.value);
                      const updated = updateEncuentroSettings(encuentro.id, { guessWhoPercentage: val });
                      if (updated) onEncuentroUpdated(updated);
                    }}
                    className="w-full accent-[#ff007a] cursor-pointer h-2 bg-purple-950 rounded-lg"
                  />
                  <span className="text-[11px] font-bold text-pink-300">100%</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { pct: 50, label: '50% Rápida' },
                    { pct: 70, label: '70% Clásica' },
                    { pct: 100, label: '100% Completa' }
                  ].map(preset => (
                    <button
                      key={preset.pct}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        const updated = updateEncuentroSettings(encuentro.id, { guessWhoPercentage: preset.pct });
                        if (updated) onEncuentroUpdated(updated);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition ${
                        (encuentro.guessWhoPercentage ?? 70) === preset.pct
                          ? 'bg-[#ff007a]/30 border-[#ff007a] text-white shadow-sm'
                          : 'bg-white/5 border-white/10 text-purple-300 hover:bg-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-purple-300/70 pt-1">
                  {(encuentro.guessWhoPercentage ?? 70) === 100
                    ? '🔥 Modo Intenso: Se adivinarán absolutamente todas las respuestas de los participantes.'
                    : `🎲 Se seleccionará al azar el ${encuentro.guessWhoPercentage ?? 70}% de las respuestas recibidas para adivinar el autor.`
                  }
                </p>
              </div>
            </div>

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
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs font-semibold">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              <span>Regla Guess Who: <b className="text-white">{encuentro.guessWhoPercentage ?? 70}% de preguntas</b> al azar</span>
            </div>
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
