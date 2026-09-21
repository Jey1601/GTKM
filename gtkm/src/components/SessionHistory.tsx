import React, { useState } from 'react';
import { BookOpen, X, Sparkles, MessageCircle, ArrowLeft, RotateCcw, Home } from 'lucide-react';
import { Encuentro, Player, PlayerAnswer } from '../types';
import { restartEncuentroGame } from '../services/gameService';
import { sounds } from '../utils/audio';

interface SessionHistoryProps {
  encuentro: Encuentro;
  onRestart: (updated: Encuentro) => void;
  onGoHome: () => void;
  onViewAllHistory?: () => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  encuentro,
  onRestart,
  onGoHome,
  onViewAllHistory
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Obtener respuestas del jugador seleccionado
  const playerAnswers: PlayerAnswer[] = selectedPlayer
    ? encuentro.allAnswers.filter(a => a.playerId === selectedPlayer.id)
    : [];

  const handleSelectPlayer = (player: Player) => {
    sounds.playPop();
    setSelectedPlayer(player);
  };

  const handleCloseModal = () => {
    sounds.playClick();
    setSelectedPlayer(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-[#1b143f] border border-purple-500/30 rounded-3xl p-6 sm:p-8 mb-8 text-center shadow-2xl relative">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4 text-cyan-400" /> Galería de Recuerdos
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Resumen del Encuentro: {encuentro.title}
        </h1>
        <p className="text-sm text-purple-200 mt-2 max-w-xl mx-auto">
          Haz clic sobre el avatar de cualquier participante para descubrir todas las respuestas y secretos que compartió en esta sesión.
        </p>

        {/* Quick Back Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={onGoHome}
            className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>

          {onViewAllHistory && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onViewAllHistory();
              }}
              className="px-5 py-2.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Ver Historial de Todos los Encuentros</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sounds.playSuccess();
              const updated = restartEncuentroGame(encuentro.id);
              if (updated) onRestart(updated);
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#ff007a] to-[#ff5900] hover:opacity-90 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jugar Nueva Partida</span>
          </button>
        </div>
      </div>

      {/* Participant Mosaic Gallery */}
      <div className="mb-10">
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <span>👥 Participantes (Haz clic para ver sus respuestas)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {encuentro.players.map(player => {
            const count = encuentro.allAnswers.filter(a => a.playerId === player.id).length;
            const isSelected = selectedPlayer?.id === player.id;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => handleSelectPlayer(player)}
                className={`p-5 rounded-3xl text-center transition-all duration-200 border-2 relative group flex flex-col items-center cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#281854] border-[#00d2ff] shadow-[0_0_25px_rgba(0,210,255,0.4)] scale-105'
                    : 'bg-[#1a133f] border-purple-500/30 hover:border-pink-500/60 hover:bg-[#231a52]'
                }`}
              >
                {/* Drawn Avatar */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 relative">
                  <img
                    src={player.avatarDataUrl}
                    alt={player.name}
                    className="w-full h-full object-cover rounded-2xl bg-white border-2 border-purple-300/40 shadow-md group-hover:scale-105 transition"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-2 right-0 bg-[#ff007a] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                    {count} resp.
                  </div>
                </div>

                <span className="text-sm sm:text-base font-black text-white truncate max-w-full block">
                  {player.name}
                </span>
                <span className="text-xs font-bold text-pink-400 truncate max-w-full block">
                  @{player.nickname}
                </span>

                <div className="mt-2 text-xs font-extrabold text-cyan-300 group-hover:underline flex items-center gap-1">
                  <span>Ver anécdotas</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer Modal / Detail Card */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b143f] border-2 border-[#00d2ff] rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Author Header */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
              <img
                src={selectedPlayer.avatarDataUrl}
                alt={selectedPlayer.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-white border-2 border-cyan-400 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 block">
                  Respuestas de la Sesión
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {selectedPlayer.name}
                </h3>
                <p className="text-sm font-bold text-pink-400">
                  @{selectedPlayer.nickname}
                </p>
              </div>
            </div>

            {/* Answers List */}
            <div className="space-y-4">
              {playerAnswers.length > 0 ? (
                playerAnswers.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#120e28] rounded-2xl border border-white/10 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <p className="text-sm font-bold text-white">
                        {item.questionText}
                      </p>
                    </div>
                    <div className="pl-6 border-l-2 border-amber-400/50 mt-2">
                      <p className="text-sm sm:text-base font-extrabold text-amber-300 italic">
                        "{item.answerText}"
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-purple-300 text-sm">
                  No se registraron respuestas para este jugador en la sesión.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 text-right">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
