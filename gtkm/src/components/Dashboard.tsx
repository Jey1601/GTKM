import React, { useState } from 'react';
import { PlusCircle, LogIn, Sparkles, Edit3, HelpCircle, Flame, CheckCircle, Dice5, Share2, Sliders } from 'lucide-react';
import { User, Encuentro } from '../types';
import { createEncuentro, joinEncuentro } from '../services/gameService';
import { DEFAULT_QUESTION_PACKS } from '../data/questions';
import { sounds } from '../utils/audio';

interface DashboardProps {
  currentUser: User;
  onEnterEncuentro: (encuentro: Encuentro) => void;
  onEditAvatar: () => void;
  onViewHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onEnterEncuentro,
  onEditAvatar,
  onViewHistory
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState('pack_amigos');
  const [customQuestionsInput, setCustomQuestionsInput] = useState('');
  const [useCustomQuestions, setUseCustomQuestions] = useState(false);
  const [guessWhoPercentage, setGuessWhoPercentage] = useState<number>(70);

  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = joinCode.trim().toUpperCase();

    if (!clean || clean.length < 3) {
      setErrorMsg('Por favor introduce un código de encuentro válido.');
      sounds.playBuzzer();
      return;
    }

    setIsJoining(true);
    try {
      const res = await joinEncuentro(clean, currentUser);
      if (!res.success || !res.encuentro) {
        setErrorMsg(res.error || 'No se pudo conectar a ese encuentro.');
        sounds.playBuzzer();
        return;
      }

      sounds.playSuccess();
      onEnterEncuentro(res.encuentro);
    } catch (err) {
      setErrorMsg('Error al conectar con la base de datos en la nube.');
      sounds.playBuzzer();
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = () => {
    setErrorMsg(null);
    sounds.playPop();

    let customQuestionsList: string[] | undefined = undefined;
    if (useCustomQuestions && customQuestionsInput.trim()) {
      customQuestionsList = customQuestionsInput
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 5);
      
      if (customQuestionsList.length === 0) {
        setErrorMsg('Escribe al menos una pregunta válida para el pack personalizado.');
        sounds.playBuzzer();
        return;
      }
    }

    const nuevoEncuentro = createEncuentro(currentUser, selectedPackId, customQuestionsList, guessWhoPercentage);
    sounds.playSuccess();
    onEnterEncuentro(nuevoEncuentro);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Welcome & Profile Pill Hero */}
      <div className="bg-gradient-to-r from-[#20154d] via-[#2f1b63] to-[#1e1346] border-2 border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_15px_45px_rgba(0,0,0,0.5)] mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="relative group cursor-pointer" onClick={onEditAvatar}>
            <img
              src={currentUser.avatarDataUrl}
              alt={currentUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover bg-white border-4 border-[#ff007a] shadow-[0_0_25px_rgba(255,0,122,0.4)] group-hover:scale-105 transition"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              className="absolute -bottom-2 -right-2 p-1.5 bg-[#ff007a] text-white rounded-full shadow-lg hover:bg-[#ff3399] transition"
              title="Editar avatar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Jugador Listo
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              ¡Hola, {currentUser.name}!
            </h1>
            <p className="text-purple-300 font-semibold text-sm">
              Nickname en partida: <span className="text-[#00d2ff]">@{currentUser.nickname}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onViewHistory();
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>Ver Historial de Encuentros</span>
          </button>

          <button
            type="button"
            onClick={onEditAvatar}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-purple-200 font-bold text-xs sm:text-sm transition flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4 text-pink-400" />
            <span>Rediseñar mi Avatar</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm font-semibold flex items-center gap-2">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Main Actions: Create vs Join */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Unirse a un Encuentro */}
        <div className="bg-[#1b143f] border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between hover:border-cyan-400/60 transition">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 text-2xl">
              🔑
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              Unirse a un Encuentro
            </h2>
            <p className="text-purple-200/80 text-sm mb-5">
              Si tu amigo o familiar ya creó la sala, ingresa aquí el código de 6 letras para unirte al lobby.
            </p>

            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Código de Sala (6 caracteres)
                </label>
                <input
                  id="input-join-code"
                  type="text"
                  maxLength={6}
                  placeholder="Ej. FIESTA"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-widest text-2xl font-black uppercase px-4 py-3 bg-[#120e28] border-2 border-cyan-500/40 rounded-2xl text-cyan-300 placeholder-purple-400/40 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition"
                />
              </div>

              <button
                id="btn-join-encounter"
                type="submit"
                disabled={isJoining}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] disabled:opacity-60 text-white font-extrabold text-base shadow-[0_4px_20px_rgba(0,210,255,0.4)] transition flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Buscando en la nube...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Entrar al Encuentro</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-purple-300/70 flex items-center justify-between">
            <span>¿Jugarás desde el celular?</span>
            <span className="font-bold text-cyan-300">100% Responsivo 📱</span>
          </div>
        </div>

        {/* Card 2: Crear un Encuentro */}
        <div className="bg-[#1b143f] border-2 border-pink-500/30 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between hover:border-pink-500/60 transition">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4 text-2xl">
              🎉
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              Crear un Encuentro
            </h2>
            <p className="text-purple-200/80 text-sm mb-4">
              Sé el anfitrión, obtén un código único y reúne a tus amigos para descubrir quién es quién.
            </p>

            {/* Pack selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-pink-300 mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-pink-400" /> Elige el pack de preguntas:
              </label>

              <div className="space-y-2">
                {DEFAULT_QUESTION_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedPackId(pack.id);
                      setUseCustomQuestions(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                      !useCustomQuestions && selectedPackId === pack.id
                        ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                        : 'bg-[#120e28]/70 border-white/10 text-purple-200 hover:bg-[#120e28]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{pack.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{pack.name}</div>
                        <div className="text-xs text-purple-300/70">{pack.questions.length} preguntas grupales</div>
                      </div>
                    </div>
                    {!useCustomQuestions && selectedPackId === pack.id && (
                      <CheckCircle className="w-5 h-5 text-pink-400 shrink-0" />
                    )}
                  </button>
                ))}

                {/* Custom pack toggle */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setUseCustomQuestions(!useCustomQuestions);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    useCustomQuestions
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                      : 'bg-[#120e28]/70 border-white/10 text-purple-200 hover:bg-[#120e28]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">✍️</span>
                    <div>
                      <div className="text-sm font-bold text-white">Escribir mis propias preguntas</div>
                      <div className="text-xs text-purple-300/70">Personaliza la sesión a tu medida</div>
                    </div>
                  </div>
                  {useCustomQuestions && <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />}
                </button>
              </div>

              {useCustomQuestions && (
                <div className="mt-3">
                  <textarea
                    rows={3}
                    placeholder="Escribe una pregunta por línea...&#10;Ej: ¿Quién tiene más multas de tráfico?&#10;¿Cuál es tu peor cita?"
                    value={customQuestionsInput}
                    onChange={e => setCustomQuestionsInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120e28] border border-amber-400/40 rounded-xl text-white text-xs placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Selector de porcentaje de preguntas para Guess Who */}
            <div className="mb-5 p-4 rounded-2xl bg-[#120e28]/80 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-pink-400" />
                  <span>% Preguntas en Guess Who:</span>
                </label>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-black text-xs border border-pink-500/30">
                  {guessWhoPercentage}%
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-purple-400">20%</span>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={guessWhoPercentage}
                    onChange={e => {
                      setGuessWhoPercentage(Number(e.target.value));
                    }}
                    className="w-full accent-[#ff007a] cursor-pointer h-2 bg-purple-950 rounded-lg"
                  />
                  <span className="text-[11px] font-bold text-pink-300">100%</span>
                </div>

                {/* Botones de preajuste rápido */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { pct: 50, label: '50% Rápida', desc: '1 de cada 2' },
                    { pct: 70, label: '70% Clásica', desc: 'Equilibrada' },
                    { pct: 100, label: '100% Completa', desc: 'Todas las rtas' }
                  ].map(preset => (
                    <button
                      key={preset.pct}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setGuessWhoPercentage(preset.pct);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition ${
                        guessWhoPercentage === preset.pct
                          ? 'bg-[#ff007a]/30 border-[#ff007a] text-white shadow-sm'
                          : 'bg-white/5 border-white/10 text-purple-300 hover:bg-white/10'
                      }`}
                    >
                      <div>{preset.label}</div>
                      <div className="text-[9px] opacity-75 font-normal">{preset.desc}</div>
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-purple-300/80 leading-tight">
                  {guessWhoPercentage === 100 ? (
                    <span>🔥 <b className="text-white">Modo Intenso:</b> Se adivinarán absolutamente todas las respuestas de los participantes.</span>
                  ) : guessWhoPercentage <= 50 ? (
                    <span>⚡ <b className="text-white">Modo Dinámico:</b> Solo se adivinará la mitad de las respuestas para una partida más ágil.</span>
                  ) : (
                    <span>🎲 <b className="text-white">Modo Equilibrado:</b> Se seleccionará al azar el {guessWhoPercentage}% de respuestas dejadas por los amigos.</span>
                  )}
                </p>
              </div>
            </div>

            <button
              id="btn-create-encounter"
              type="button"
              onClick={handleCreate}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff5900] to-[#ffd60a] hover:opacity-95 active:scale-[0.98] text-white font-extrabold text-base shadow-[0_4px_25px_rgba(255,0,122,0.4)] transition flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Generar Sala y Código</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-purple-300/70 flex items-center justify-between">
            <span>Regla Guess Who configurada:</span>
            <span className="font-bold text-pink-300">{guessWhoPercentage}% de respuestas al azar 🎲</span>
          </div>
        </div>
      </div>

      {/* How it works info card */}
      <div className="mt-8 p-5 bg-[#140f30] rounded-3xl border border-white/10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl text-2xl shrink-0">
            🎮
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">¿Cómo se juega a GetToKnowMe?</h3>
            <p className="text-xs text-purple-300/80 leading-relaxed">
              1. Dibuja tu avatar único. 2. Todos contestan preguntas en privado. 3. El sistema elige el 70% al azar. 4. ¡Adivinan quién escribió cada respuesta y los encuentros quedan guardados en el historial!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            onViewHistory();
          }}
          className="shrink-0 px-4 py-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500 hover:text-black font-extrabold text-xs transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ver Mosaicos y Respuestas Anteriores</span>
        </button>
      </div>
    </div>
  );
};
