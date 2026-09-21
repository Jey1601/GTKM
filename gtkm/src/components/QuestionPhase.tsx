import React, { useState } from 'react';
import { Send, CheckCircle2, Clock, HelpCircle, Sparkles } from 'lucide-react';
import { Encuentro, User } from '../types';
import { submitPlayerAnswers } from '../services/gameService';
import { sounds } from '../utils/audio';

interface QuestionPhaseProps {
  encuentro: Encuentro;
  currentUser: User;
  onEncuentroUpdated: (updated: Encuentro) => void;
}

export const QuestionPhase: React.FC<QuestionPhaseProps> = ({
  encuentro,
  currentUser,
  onEncuentroUpdated
}) => {
  const currentPlayer = encuentro.players.find(p => p.id === currentUser.id);
  const alreadyAnswered = currentPlayer?.hasAnsweredAll ?? false;

  // Respuestas locales para cada pregunta
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Si ya había contestado antes
    const initial: Record<string, string> = {};
    encuentro.questions.forEach(q => {
      const existing = encuentro.allAnswers.find(a => a.playerId === currentUser.id && a.questionId === q.id);
      initial[q.id] = existing ? existing.answerText : '';
    });
    return initial;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentQ = encuentro.questions[currentQuestionIndex];
  const totalQuestions = encuentro.questions.length;

  const handleAnswerChange = (text: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: text
    }));
  };

  const handleNextOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const text = (answers[currentQ.id] || '').trim();
    if (!text) {
      setErrorMsg('Por favor escribe tu respuesta antes de continuar.');
      sounds.playBuzzer();
      return;
    }

    sounds.playPop();

    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Validar que todas las preguntas tengan respuesta
      const allFilled = encuentro.questions.every(q => (answers[q.id] || '').trim().length > 0);
      if (!allFilled) {
        setErrorMsg('Hay preguntas sin responder. Por favor revisa tus respuestas.');
        sounds.playBuzzer();
        return;
      }

      // Enviar respuestas al servicio
      const formattedAnswers = encuentro.questions.map(q => ({
        questionId: q.id,
        answerText: answers[q.id].trim()
      }));

      sounds.playSuccess();
      const updated = submitPlayerAnswers(encuentro.id, currentUser.id, formattedAnswers);
      if (updated) {
        onEncuentroUpdated(updated);
      }
    }
  };

  // Calcular el progreso del 100% de los jugadores
  const answeredCount = encuentro.players.filter(p => p.hasAnsweredAll).length;
  const totalPlayers = encuentro.players.length;
  const progressPercent = totalPlayers > 0 ? Math.round((answeredCount / totalPlayers) * 100) : 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* 100% Completion Progress Bar at the top */}
      <div className="bg-[#1b143f] border border-purple-500/30 rounded-3xl p-4 sm:p-5 shadow-xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" /> Progreso de la sala:
          </span>
          <span className="text-xs sm:text-sm font-black text-cyan-300">
            {answeredCount} de {totalPlayers} listos ({progressPercent}%)
          </span>
        </div>

        {/* Bar */}
        <div className="w-full bg-[#120e28] rounded-full h-3.5 p-0.5 overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-cyan-400 via-[#ff007a] to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Player Status Avatars */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {encuentro.players.map(p => (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                p.hasAnsweredAll
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 scale-105'
                  : 'bg-white/5 text-purple-400 border border-white/10 opacity-70'
              }`}
            >
              <img
                src={p.avatarDataUrl}
                alt={p.name}
                className="w-5 h-5 rounded-full object-cover bg-white"
                referrerPolicy="no-referrer"
              />
              <span>{p.nickname}</span>
              {p.hasAnsweredAll && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
          ))}
        </div>
      </div>

      {/* If current player already finished all, show waiting card */}
      {alreadyAnswered ? (
        <div className="bg-[#1b143f] border-2 border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-3xl animate-bounce">
            🎉
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            ¡Has completado tus respuestas!
          </h2>
          <p className="text-sm text-purple-200/80 max-w-md mx-auto">
            El sistema está esperando a que el 100% de los participantes termine de contestar para iniciar el modo <b className="text-pink-400">Guess Who (Adivina Quién)</b>.
          </p>
          <div className="pt-4 flex items-center justify-center gap-2 text-xs font-bold text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Esperando a los demás jugadores...</span>
          </div>
        </div>
      ) : (
        /* Answering Question Card */
        <div className="bg-[#1b143f] border-2 border-[#ff007a]/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Question Step Indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Pregunta {currentQuestionIndex + 1} de {totalQuestions}
            </span>
            <div className="flex gap-1.5">
              {encuentro.questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition ${
                    idx === currentQuestionIndex
                      ? 'bg-[#ff007a] scale-125'
                      : (answers[encuentro.questions[idx].id] || '').trim().length > 0
                      ? 'bg-emerald-400'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Big Question Prompt */}
          <div className="bg-[#120e28] border-2 border-purple-500/30 rounded-2xl p-5 sm:p-6 mb-6 shadow-inner text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              "{currentQ.text}"
            </h2>
            <span className="text-xs text-purple-400 mt-2 block font-semibold">
              ¡Sé creativo, divertido o misterioso! Nadie sabrá que fue tuya hasta la ronda de revelación.
            </span>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Answer Form */}
          <form onSubmit={handleNextOrSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-2">
                Tu Respuesta Confidencial:
              </label>
              <textarea
                id="input-player-answer"
                rows={4}
                placeholder="Escribe aquí tu respuesta sincera o divertida..."
                value={answers[currentQ.id] || ''}
                onChange={e => handleAnswerChange(e.target.value)}
                className="w-full px-4 py-3 bg-[#120e28] border-2 border-purple-500/30 focus:border-[#ff007a] rounded-2xl text-white placeholder-purple-400/40 focus:outline-none focus:ring-4 focus:ring-[#ff007a]/20 text-base leading-relaxed transition"
                autoFocus
              />
            </div>

            {/* Navigation / Submit Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    sounds.playClick();
                    setCurrentQuestionIndex(prev => prev - 1);
                  }
                }}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ← Anterior
              </button>

              <button
                id="btn-submit-answer-step"
                type="submit"
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff007a] to-[#ff5900] hover:opacity-95 active:scale-95 text-white font-black text-base shadow-[0_4px_20px_rgba(255,0,122,0.4)] transition flex items-center gap-2"
              >
                {currentQuestionIndex + 1 < totalQuestions ? (
                  <>
                    <span>Siguiente Pregunta</span>
                    <span>→</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>¡Enviar todas mis Respuestas!</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
