import React, { useState } from 'react';
import { HelpCircle, CheckCircle, Sparkles, Flame, Eye, Vote, Users } from 'lucide-react';
import { Encuentro, User } from '../types';
import { submitVote, revealCurrentRound } from '../services/gameService';
import { sounds } from '../utils/audio';

interface GuessWhoVotingProps {
  encuentro: Encuentro;
  currentUser: User;
  onEncuentroUpdated: (updated: Encuentro) => void;
}

export const GuessWhoVoting: React.FC<GuessWhoVotingProps> = ({
  encuentro,
  currentUser,
  onEncuentroUpdated
}) => {
  const currentRound = encuentro.guessWhoRounds[encuentro.currentRoundIndex];
  const isHost = encuentro.hostId === currentUser.id;

  const currentVote = currentRound?.votes[currentUser.id];
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(currentVote || null);

  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  if (!currentRound) {
    return (
      <div className="text-center p-8 text-white">
        No hay rondas disponibles en este momento.
      </div>
    );
  }

  const handleSelectVote = async (targetPlayerId: string) => {
    sounds.playPop();
    setSelectedPlayerId(targetPlayerId);
    setIsSubmittingVote(true);

    try {
      const updated = await submitVote(encuentro.id, currentUser.id, targetPlayerId);
      if (updated) {
        onEncuentroUpdated(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleReveal = async () => {
    setIsRevealing(true);
    sounds.playDrumroll();
    try {
      const updated = await revealCurrentRound(encuentro.id);
      if (updated) {
        onEncuentroUpdated(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRevealing(false);
    }
  };

  const totalVoters = encuentro.players.length;
  const currentVotesCount = Object.keys(currentRound.votes || {}).length;
  const allVoted = currentVotesCount >= totalVoters;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Top Header: Round badge and 70% notification */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-[#1b143f] p-4 rounded-3xl border border-purple-500/30">
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-[#ff007a] text-white text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-md">
            <Flame className="w-3.5 h-3.5" />
            <span>Ronda {encuentro.currentRoundIndex + 1} de {encuentro.totalSelectedRounds}</span>
          </div>
          <span className="text-xs text-purple-300 font-bold hidden sm:inline">
            ({encuentro.guessWhoPercentage ?? 70}% seleccionado al azar de la sesión)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 bg-[#120e28] px-3 py-1.5 rounded-full border border-white/10">
          <Vote className="w-4 h-4 text-cyan-400" />
          <span>Votos: {currentVotesCount} / {totalVoters}</span>
        </div>
      </div>

      {/* Main Question & Anonymous Answer Card */}
      <div className="bg-gradient-to-br from-[#1d1445] to-[#281754] border-3 border-[#ff007a] rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(255,0,122,0.3)] mb-8 text-center relative overflow-hidden">
        {/* Playful background stickers */}
        <div className="absolute top-2 right-4 text-5xl opacity-20 select-none">🕵️‍♂️</div>
        <div className="absolute bottom-2 left-4 text-5xl opacity-20 select-none">❓</div>

        {/* Question tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2">
          <HelpCircle className="w-3.5 h-3.5" /> Pregunta Realizada
        </div>

        {/* The Question */}
        <h2 className="text-xl sm:text-2xl font-black text-white mb-4 px-2">
          "{currentRound.questionText}"
        </h2>

        {/* The Anonymous Answer Box */}
        <div className="bg-[#120e28] border-2 border-amber-400/60 rounded-3xl p-6 sm:p-7 shadow-inner max-w-2xl mx-auto my-2 transform hover:scale-[1.01] transition">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-2">
            💬 Alguien respondió en privado:
          </span>
          <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tight leading-snug">
            "{currentRound.answerText}"
          </p>
        </div>

        <p className="text-xs sm:text-sm text-purple-200 mt-4 font-bold">
          ¿A cuál de los participantes le pertenece esta respuesta? ¡Haz clic en su avatar para votar!
        </p>
      </div>

      {/* Candidate Voting Mosaic */}
      <div className="mb-8">
        <h3 className="text-lg font-black text-white mb-3 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
          <Users className="w-5 h-5 text-pink-400" />
          <span>Elige al autor sospechoso:</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {encuentro.players.map(player => {
            const isSelected = selectedPlayerId === player.id;
            const hasVoted = Boolean(currentRound.votes[player.id]);

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => handleSelectVote(player.id)}
                className={`p-4 rounded-3xl text-center transition-all duration-200 border-3 relative group flex flex-col items-center active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#ff007a]/30 to-[#1b143f] border-[#ff007a] shadow-[0_0_30px_rgba(255,0,122,0.5)] scale-105'
                    : 'bg-[#1a133f] border-purple-500/30 hover:border-purple-300 hover:bg-[#231a52]'
                }`}
              >
                {/* Check badge when voted */}
                {isSelected && (
                  <div className="absolute top-2 right-2 p-1.5 bg-[#ff007a] text-white rounded-full shadow-md animate-bounce">
                    <CheckCircle className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                {/* Drawn Avatar */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 relative">
                  <img
                    src={player.avatarDataUrl}
                    alt={player.name}
                    className="w-full h-full object-cover rounded-2xl bg-white border-2 border-purple-300/40 shadow-md group-hover:scale-105 transition"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <span className="text-sm font-extrabold text-white truncate max-w-full block">
                  {player.name}
                </span>
                <span className="text-xs font-bold text-pink-400 truncate max-w-full block">
                  @{player.nickname}
                </span>

                <div className="mt-2 text-[10px] font-bold">
                  {isSelected ? (
                    <span className="text-[#ff007a] font-black uppercase tracking-wider">¡Tu Voto!</span>
                  ) : (
                    <span className="text-purple-400 group-hover:text-white">Votar por él</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer: Host Reveal Button */}
      <div className="bg-[#140f30] border border-white/10 rounded-3xl p-6 text-center">
        {selectedPlayerId ? (
          <div className="space-y-3">
            <div className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>¡Tu voto ha sido registrado!</span>
            </div>

            {isHost ? (
              <button
                id="btn-reveal-author"
                type="button"
                onClick={handleReveal}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00d2ff] via-[#7928ca] to-[#ff007a] hover:opacity-95 active:scale-95 text-white font-black text-lg shadow-[0_4px_30px_rgba(0,210,255,0.4)] transition inline-flex items-center gap-2"
              >
                <Eye className="w-6 h-6" />
                <span>¡REVELAR QUIÉN FUE EL AUTOR!</span>
              </button>
            ) : (
              <p className="text-xs text-purple-300 font-semibold">
                Esperando a que el anfitrión revele el misterio...
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm font-bold text-amber-300 animate-pulse">
            👆 Elige un avatar arriba para emitir tu voto.
          </p>
        )}
      </div>
    </div>
  );
};
