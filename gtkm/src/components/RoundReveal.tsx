import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, ArrowRight, CheckCircle2, XCircle, HeartHandshake, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Encuentro, User } from '../types';
import { advanceToNextRoundOrLeaderboard } from '../services/gameService';
import { sounds } from '../utils/audio';

interface RoundRevealProps {
  encuentro: Encuentro;
  currentUser: User;
  onEncuentroUpdated: (updated: Encuentro) => void;
}

export const RoundReveal: React.FC<RoundRevealProps> = ({
  encuentro,
  currentUser,
  onEncuentroUpdated
}) => {
  const currentRound = encuentro.guessWhoRounds[encuentro.currentRoundIndex];
  const isHost = encuentro.hostId === currentUser.id;
  const isFinalRound = encuentro.currentRoundIndex + 1 >= encuentro.totalSelectedRounds;

  const [revealedAnimation, setRevealedAnimation] = useState(false);

  useEffect(() => {
    // Suspenso inicial y luego boom de revelación
    const timer = setTimeout(() => {
      setRevealedAnimation(true);
      sounds.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Safe fallback
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [encuentro.currentRoundIndex]);

  if (!currentRound) return null;

  const author = encuentro.players.find(p => p.id === currentRound.authorId);
  const correctGuessers = encuentro.players.filter(p => {
    return p.id !== currentRound.authorId && currentRound.votes[p.id] === currentRound.authorId;
  });
  const mistakenGuessers = encuentro.players.filter(p => {
    return p.id !== currentRound.authorId && currentRound.votes[p.id] && currentRound.votes[p.id] !== currentRound.authorId;
  });

  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleNext = async () => {
    setIsAdvancing(true);
    sounds.playPop();
    try {
      const updated = await advanceToNextRoundOrLeaderboard(encuentro.code || encuentro.id);
      if (updated) {
        onEncuentroUpdated(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Question & Answer Reminder Header */}
      <div className="bg-[#1b143f] border border-purple-500/30 rounded-3xl p-5 mb-6 text-center shadow-lg">
        <span className="text-xs font-black uppercase text-pink-400 tracking-wider">
          Pregunta {encuentro.currentRoundIndex + 1} de {encuentro.totalSelectedRounds}
        </span>
        <h3 className="text-lg sm:text-xl font-black text-white mt-1">
          "{currentRound.questionText}"
        </h3>
        <div className="mt-3 p-3 bg-[#120e28] rounded-2xl border border-white/10 inline-block max-w-xl">
          <p className="text-base sm:text-lg font-extrabold text-amber-300 italic">
            "{currentRound.answerText}"
          </p>
        </div>
      </div>

      {/* Dramatic Author Reveal Card */}
      <div className="bg-gradient-to-b from-[#251554] to-[#160e34] border-3 border-amber-400 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(255,214,10,0.25)] text-center mb-8 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-amber-400/20 to-cyan-500/10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-widest mb-4">
          <Eye className="w-4 h-4 text-amber-400" /> ¡EL AUTOR REAL ES...!
        </div>

        {/* Big Avatar */}
        <div className={`transition-all duration-700 transform ${
          revealedAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}>
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-pink-500 to-cyan-400 shadow-[0_0_35px_rgba(255,214,10,0.5)]">
              <img
                src={author?.avatarDataUrl || currentRound.authorAvatar}
                alt={currentRound.authorName}
                className="w-full h-full object-cover rounded-[22px] bg-white border-2 border-white"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-black text-xs font-black rounded-full shadow-lg whitespace-nowrap">
              ✍️ AUTOR
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {currentRound.authorName}
          </h2>
          <p className="text-base text-pink-400 font-extrabold">
            @{currentRound.authorNickname}
          </p>
        </div>
      </div>

      {/* Breakdown: Who guessed correctly & Who was fooled */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Correct Guessers */}
        <div className="bg-[#1b143f] border-2 border-emerald-500/40 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 font-black text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡Adivinaron bien! (+100 pts)</span>
          </div>

          {correctGuessers.length > 0 ? (
            <div className="space-y-2">
              {correctGuessers.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 bg-[#120e28] rounded-2xl border border-emerald-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.avatarDataUrl}
                      alt={p.name}
                      className="w-9 h-9 rounded-xl object-cover bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">{p.name}</span>
                      <span className="text-xs text-emerald-300 font-semibold">@{p.nickname}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
                    +100
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-purple-300 font-semibold">
              😅 ¡Nadie logró adivinar! {currentRound.authorName} los engañó a todos.
            </div>
          )}
        </div>

        {/* Fooled / Mistaken Guessers */}
        <div className="bg-[#1b143f] border-2 border-pink-500/30 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3 text-pink-400 font-black text-sm uppercase tracking-wider">
            <XCircle className="w-5 h-5" />
            <span>Cayeron en la trampa:</span>
          </div>

          {mistakenGuessers.length > 0 ? (
            <div className="space-y-2">
              {mistakenGuessers.map(p => {
                const votedForId = currentRound.votes[p.id];
                const votedPlayer = encuentro.players.find(pl => pl.id === votedForId);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-[#120e28] rounded-2xl border border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatarDataUrl}
                        alt={p.name}
                        className="w-9 h-9 rounded-xl object-cover bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="text-sm font-bold text-white block">{p.name}</span>
                        <span className="text-xs text-purple-400">
                          Sospechó de: <b className="text-pink-300">@{votedPlayer?.nickname || 'Alguien'}</b>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-purple-300 font-semibold">
              👏 Todos tenían claras las sospechas.
            </div>
          )}
        </div>
      </div>

      {/* Next Step Button (Host control or common progression) */}
      <div className="bg-[#140f30] border border-white/10 rounded-3xl p-6 text-center">
        {isHost ? (
          <button
            id="btn-advance-round"
            type="button"
            onClick={handleNext}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff5900] to-[#ffd60a] hover:opacity-95 active:scale-95 text-white font-black text-lg shadow-[0_6px_30px_rgba(255,0,122,0.4)] transition inline-flex items-center gap-2"
          >
            {isFinalRound ? (
              <>
                <Trophy className="w-6 h-6 text-yellow-300" />
                <span>¡VER TABLA DE POSICIONES Y PODIO!</span>
              </>
            ) : (
              <>
                <span>Siguiente Ronda de Adivinanza</span>
                <ArrowRight className="w-6 h-6 stroke-[3]" />
              </>
            )}
          </button>
        ) : (
          <p className="text-sm font-bold text-purple-300">
            {isFinalRound
              ? 'Esperando al anfitrión para ver la gran tabla de posiciones final...'
              : 'Esperando al anfitrión para iniciar la siguiente ronda...'}
          </p>
        )}
      </div>
    </div>
  );
};
