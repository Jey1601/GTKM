import React, { useEffect } from 'react';
import { Trophy, Crown, Medal, Sparkles, BookOpen, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Encuentro, User } from '../types';
import { viewEncuentroHistory, restartEncuentroGame } from '../services/gameService';
import { sounds } from '../utils/audio';

interface LeaderboardProps {
  encuentro: Encuentro;
  currentUser: User;
  onEncuentroUpdated: (updated: Encuentro) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  encuentro,
  currentUser,
  onEncuentroUpdated
}) => {
  // Sort players by score descending
  const sortedPlayers = [...encuentro.players].sort((a, b) => b.score - a.score);

  const firstPlace = sortedPlayers[0];
  const secondPlace = sortedPlayers[1];
  const thirdPlace = sortedPlayers[2];
  const remainingPlayers = sortedPlayers.slice(3);

  useEffect(() => {
    sounds.playFanfare();

    // Multicolored celebration confetti
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff007a', '#00d2ff', '#ffd60a', '#30d158']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff007a', '#00d2ff', '#ffd60a', '#30d158']
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const handleGoToHistory = () => {
    sounds.playPop();
    const updated = viewEncuentroHistory(encuentro.id);
    if (updated) {
      onEncuentroUpdated(updated);
    }
  };

  const handlePlayAgain = () => {
    sounds.playSuccess();
    const updated = restartEncuentroGame(encuentro.id);
    if (updated) {
      onEncuentroUpdated(updated);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Gran Final
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Tabla de Posiciones
        </h1>
        <p className="text-sm text-purple-200 mt-1">
          ¡Así quedaron las puntuaciones de este inolvidable encuentro!
        </p>
      </div>

      {/* Visual Podium (1st, 2nd, 3rd) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto mb-10 pt-8">
        {/* 2nd Place */}
        {secondPlace && (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-tr from-slate-400 to-slate-200 shadow-lg">
                <img
                  src={secondPlace.avatarDataUrl}
                  alt={secondPlace.name}
                  className="w-full h-full object-cover rounded-[14px] bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -top-3 -right-2 p-1.5 bg-slate-300 text-slate-900 rounded-full shadow-md font-black text-xs">
                🥈 2º
              </div>
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-full block">
              {secondPlace.name}
            </span>
            <span className="text-[11px] text-pink-400 font-bold block">
              @{secondPlace.nickname}
            </span>
            <div className="w-full mt-2 bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-2xl py-4 sm:py-6 text-center border-t-2 border-slate-300">
              <span className="text-base sm:text-xl font-black text-white">{secondPlace.score}</span>
              <span className="text-[10px] text-slate-300 block uppercase font-bold">pts</span>
            </div>
          </div>
        )}

        {/* 1st Place (Center / Taller) */}
        {firstPlace && (
          <div className="flex flex-col items-center text-center -mt-6">
            <div className="relative mb-2">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                👑
              </div>
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl p-1.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_40px_rgba(255,214,10,0.6)]">
                <img
                  src={firstPlace.avatarDataUrl}
                  alt={firstPlace.name}
                  className="w-full h-full object-cover rounded-[20px] bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-black text-[11px] font-black rounded-full shadow-lg whitespace-nowrap">
                🥇 CAMPEÓN
              </div>
            </div>
            <span className="text-sm sm:text-base font-black text-white truncate max-w-full block mt-2">
              {firstPlace.name}
            </span>
            <span className="text-xs text-amber-300 font-bold block">
              @{firstPlace.nickname}
            </span>
            <div className="w-full mt-2 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl py-7 sm:py-10 text-center border-t-3 border-amber-300 shadow-xl">
              <span className="text-xl sm:text-3xl font-black text-white">{firstPlace.score}</span>
              <span className="text-xs text-amber-100 block uppercase font-black">puntos</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {thirdPlace && (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-2">
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl p-1 bg-gradient-to-tr from-amber-700 to-amber-600 shadow-lg">
                <img
                  src={thirdPlace.avatarDataUrl}
                  alt={thirdPlace.name}
                  className="w-full h-full object-cover rounded-[14px] bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -top-3 -right-2 p-1.5 bg-amber-700 text-amber-100 rounded-full shadow-md font-black text-xs">
                🥉 3º
              </div>
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-full block">
              {thirdPlace.name}
            </span>
            <span className="text-[11px] text-pink-400 font-bold block">
              @{thirdPlace.nickname}
            </span>
            <div className="w-full mt-2 bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-2xl py-3 sm:py-4 text-center border-t-2 border-amber-600">
              <span className="text-sm sm:text-lg font-black text-white">{thirdPlace.score}</span>
              <span className="text-[10px] text-amber-200 block uppercase font-bold">pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Remaining Players Mosaic Grid */}
      {remainingPlayers.length > 0 && (
        <div className="bg-[#1b143f] border border-purple-500/30 rounded-3xl p-5 sm:p-6 mb-8 shadow-xl">
          <h3 className="text-sm font-black uppercase text-purple-300 tracking-wider mb-4">
            Otros Participantes del Encuentro
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {remainingPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-[#120e28] rounded-2xl border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-purple-400 w-5">
                    #{idx + 4}
                  </span>
                  <img
                    src={player.avatarDataUrl}
                    alt={player.name}
                    className="w-10 h-10 rounded-xl object-cover bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">{player.name}</span>
                    <span className="text-xs text-pink-400 font-semibold">@{player.nickname}</span>
                  </div>
                </div>
                <span className="text-sm font-black text-white bg-purple-500/20 px-2.5 py-1 rounded-xl">
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Navigation: View History or Play Again */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-[#140f30] border border-white/10 rounded-3xl p-6 shadow-xl">
        <button
          id="btn-view-summary-history"
          type="button"
          onClick={handleGoToHistory}
          className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 active:scale-95 text-white font-black text-base shadow-lg transition flex items-center justify-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          <span>Ver Resumen Completo e Historial de Respuestas</span>
        </button>

        <button
          id="btn-play-again"
          type="button"
          onClick={handlePlayAgain}
          className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-purple-200 hover:text-white font-bold text-base transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Jugar Otra Partida</span>
        </button>
      </div>
    </div>
  );
};
