import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  BookOpen, 
  Calendar, 
  Users, 
  ChevronRight, 
  ArrowLeft, 
  Trash2, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  X,
  MessageCircle,
  Award
} from 'lucide-react';
import { Encuentro, Player, PlayerAnswer } from '../types';
import { 
  getCompletedEncuentrosHistory, 
  deleteEncuentroFromHistory,
  fetchCompletedEncuentrosHistoryFromCloud 
} from '../services/gameService';
import { sounds } from '../utils/audio';

interface EncuentrosHistoryViewProps {
  onBackToDashboard: () => void;
  onSelectEncuentroToPlay?: (encuentro: Encuentro) => void;
}

export const EncuentrosHistoryView: React.FC<EncuentrosHistoryViewProps> = ({
  onBackToDashboard
}) => {
  const [historyList, setHistoryList] = useState<Encuentro[]>([]);
  const [selectedEncuentro, setSelectedEncuentro] = useState<Encuentro | null>(null);
  const [activeTab, setActiveTab] = useState<'podium' | 'answers' | 'rounds'>('podium');
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  useEffect(() => {
    // Carga inmediata desde almacenamiento local
    const list = getCompletedEncuentrosHistory();
    setHistoryList(list);

    // Sincronizar con la nube (Firebase Firestore)
    setIsLoadingCloud(true);
    fetchCompletedEncuentrosHistoryFromCloud()
      .then(cloudList => {
        if (cloudList && cloudList.length > 0) {
          setHistoryList(cloudList);
        }
      })
      .finally(() => setIsLoadingCloud(false));
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sounds.playClick();
    const updated = deleteEncuentroFromHistory(id);
    setHistoryList(updated);
    if (selectedEncuentro?.id === id) {
      setSelectedEncuentro(null);
    }
  };

  const handleSelectEncuentro = (encuentro: Encuentro) => {
    sounds.playPop();
    setSelectedEncuentro(encuentro);
    setActiveTab('podium');
    setInspectingPlayer(null);
  };

  // Si se está inspeccionando un encuentro en detalle
  if (selectedEncuentro) {
    const sortedPlayers = [...selectedEncuentro.players].sort((a, b) => b.score - a.score);
    const firstPlace = sortedPlayers[0];
    const secondPlace = sortedPlayers[1];
    const thirdPlace = sortedPlayers[2];
    const remainingPlayers = sortedPlayers.slice(3);

    // Respuestas del jugador en inspección
    const inspectedPlayerAnswers: PlayerAnswer[] = inspectingPlayer
      ? selectedEncuentro.allAnswers.filter(a => a.playerId === inspectingPlayer.id)
      : [];

    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        {/* Navigation back bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#1b143f] p-4 rounded-3xl border border-purple-500/30">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setSelectedEncuentro(null);
            }}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Lista de Encuentros</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-300 font-bold hidden sm:inline">Código:</span>
            <span className="px-3 py-1 bg-[#120e28] text-cyan-300 rounded-xl border border-white/10 text-xs sm:text-sm font-black tracking-wider">
              {selectedEncuentro.code}
            </span>
            <span className="text-xs text-purple-400">
              {new Date(selectedEncuentro.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Title Header */}
        <div className="bg-[#1b143f] border border-purple-500/30 rounded-3xl p-6 mb-6 text-center shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Registro Histórico de Encuentro
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {selectedEncuentro.title}
          </h1>
          <p className="text-xs sm:text-sm text-purple-300 mt-1">
            {selectedEncuentro.players.length} participantes • {selectedEncuentro.allAnswers.length} respuestas registradas
          </p>

          {/* Sub-Tabs: Podio vs Respuestas vs Rondas */}
          <div className="flex items-center justify-center gap-2 mt-5 p-1.5 bg-[#120e28] rounded-2xl max-w-md mx-auto border border-white/10">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setActiveTab('podium');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                activeTab === 'podium'
                  ? 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Mosaico Posiciones</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setActiveTab('answers');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                activeTab === 'answers'
                  ? 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mosaico Respuestas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setActiveTab('rounds');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                activeTab === 'rounds'
                  ? 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Rondas Guess Who</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MOSAICO DE POSICIONES / PODIO */}
        {activeTab === 'podium' && (
          <div>
            {/* Visual Podium */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto mb-8 pt-8">
              {/* 2nd Place */}
              {secondPlace && (
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-2">
                    <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl p-1 bg-gradient-to-tr from-slate-400 to-slate-200 shadow-lg">
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
                  <span className="text-[10px] text-pink-400 font-bold block">
                    @{secondPlace.nickname}
                  </span>
                  <div className="w-full mt-2 bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-2xl py-4 text-center border-t-2 border-slate-300">
                    <span className="text-base sm:text-lg font-black text-white">{secondPlace.score}</span>
                    <span className="text-[10px] text-slate-300 block uppercase font-bold">pts</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {firstPlace && (
                <div className="flex flex-col items-center text-center -mt-6">
                  <div className="relative mb-2">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                      👑
                    </div>
                    <div className="w-22 h-22 sm:w-28 sm:h-28 rounded-3xl p-1.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_35px_rgba(255,214,10,0.5)]">
                      <img
                        src={firstPlace.avatarDataUrl}
                        alt={firstPlace.name}
                        className="w-full h-full object-cover rounded-[18px] bg-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-black text-[10px] font-black rounded-full shadow-lg whitespace-nowrap">
                      🥇 1º LUGAR
                    </div>
                  </div>
                  <span className="text-sm font-black text-white truncate max-w-full block mt-2">
                    {firstPlace.name}
                  </span>
                  <span className="text-xs text-amber-300 font-bold block">
                    @{firstPlace.nickname}
                  </span>
                  <div className="w-full mt-2 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl py-6 text-center border-t-3 border-amber-300 shadow-xl">
                    <span className="text-xl sm:text-2xl font-black text-white">{firstPlace.score}</span>
                    <span className="text-[10px] text-amber-100 block uppercase font-black">puntos</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {thirdPlace && (
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-700 to-amber-600 shadow-lg">
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
                  <span className="text-[10px] text-pink-400 font-bold block">
                    @{thirdPlace.nickname}
                  </span>
                  <div className="w-full mt-2 bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-2xl py-3 text-center border-t-2 border-amber-600">
                    <span className="text-sm sm:text-base font-black text-white">{thirdPlace.score}</span>
                    <span className="text-[10px] text-amber-200 block uppercase font-bold">pts</span>
                  </div>
                </div>
              )}
            </div>

            {/* Remaining players table */}
            {remainingPlayers.length > 0 && (
              <div className="bg-[#1b143f] border border-purple-500/30 rounded-3xl p-5 mb-8 shadow-xl">
                <h3 className="text-xs font-black uppercase text-purple-300 tracking-wider mb-3">
                  Resto de Participantes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {remainingPlayers.map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-[#120e28] rounded-2xl border border-white/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-black text-purple-400 w-4">
                          #{idx + 4}
                        </span>
                        <img
                          src={player.avatarDataUrl}
                          alt={player.name}
                          className="w-10 h-10 rounded-xl object-cover bg-white"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-white block">{player.name}</span>
                          <span className="text-[11px] text-pink-400 font-semibold">@{player.nickname}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-white bg-purple-500/20 px-2.5 py-1 rounded-xl">
                        {player.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MOSAICO DE RESPUESTAS Y GALERÍA */}
        {activeTab === 'answers' && (
          <div>
            <div className="mb-6 text-center sm:text-left">
              <h2 className="text-lg font-black text-white mb-1">
                🎨 Mosaico de Avatares
              </h2>
              <p className="text-xs text-purple-300">
                Toca cualquier avatar para abrir y leer todas las respuestas que dio esa persona en este encuentro.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              {selectedEncuentro.players.map(player => {
                const count = selectedEncuentro.allAnswers.filter(a => a.playerId === player.id).length;
                const isInspected = inspectingPlayer?.id === player.id;

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setInspectingPlayer(player);
                    }}
                    className={`p-4 rounded-3xl text-center transition-all duration-200 border-2 flex flex-col items-center active:scale-95 cursor-pointer ${
                      isInspected
                        ? 'bg-[#281854] border-[#00d2ff] shadow-[0_0_25px_rgba(0,210,255,0.4)] scale-105'
                        : 'bg-[#1a133f] border-purple-500/30 hover:border-pink-500/60 hover:bg-[#231a52]'
                    }`}
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 relative">
                      <img
                        src={player.avatarDataUrl}
                        alt={player.name}
                        className="w-full h-full object-cover rounded-2xl bg-white border-2 border-purple-300/40 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-2 right-0 bg-[#ff007a] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                        {count} anécdotas
                      </div>
                    </div>

                    <span className="text-sm font-black text-white truncate max-w-full block">
                      {player.name}
                    </span>
                    <span className="text-xs font-bold text-pink-400 truncate max-w-full block">
                      @{player.nickname}
                    </span>

                    <div className="mt-2 text-xs font-extrabold text-cyan-300 flex items-center gap-1">
                      <span>Ver respuestas</span>
                      <span>→</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal de Respuestas del Jugador */}
            {inspectingPlayer && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1b143f] border-2 border-[#00d2ff] rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-200">
                  <button
                    type="button"
                    onClick={() => setInspectingPlayer(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                    <img
                      src={inspectingPlayer.avatarDataUrl}
                      alt={inspectingPlayer.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-white border-2 border-cyan-400 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 block">
                        Respuestas del Encuentro
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        {inspectingPlayer.name}
                      </h3>
                      <p className="text-sm font-bold text-pink-400">
                        @{inspectingPlayer.nickname} • {inspectedPlayerAnswers.length} respuestas
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {inspectedPlayerAnswers.map((item, idx) => (
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
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 text-right">
                    <button
                      type="button"
                      onClick={() => setInspectingPlayer(null)}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RONDAS GUESS WHO SELECCIONADAS */}
        {activeTab === 'rounds' && (
          <div className="space-y-4 mb-8">
            <div className="mb-4 text-center sm:text-left">
              <h2 className="text-lg font-black text-white mb-1">
                ❓ Rondas Jugadas de Adivina Quién (70% al azar)
              </h2>
              <p className="text-xs text-purple-300">
                Estas fueron las respuestas seleccionadas al azar que los jugadores tuvieron que adivinar:
              </p>
            </div>

            {selectedEncuentro.guessWhoRounds.map((round, idx) => {
              const author = selectedEncuentro.players.find(p => p.id === round.authorId);
              const correctVotesCount = Object.entries(round.votes || {}).filter(([voterId, targetId]) => {
                return voterId !== round.authorId && targetId === round.authorId;
              }).length;

              return (
                <div
                  key={round.id || idx}
                  className="bg-[#1b143f] border border-purple-500/30 rounded-3xl p-5 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-[#ff007a]/20 text-pink-300 rounded-full text-xs font-black uppercase tracking-wider">
                      Ronda {idx + 1}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {correctVotesCount} acertaron
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    "{round.questionText}"
                  </h3>

                  <div className="p-3.5 bg-[#120e28] rounded-2xl border border-amber-400/30">
                    <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block mb-1">
                      Respuesta que se votó:
                    </span>
                    <p className="text-base font-black text-amber-200 italic">
                      "{round.answerText}"
                    </p>
                  </div>

                  {/* Author badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <img
                        src={author?.avatarDataUrl || round.authorAvatar}
                        alt={round.authorName}
                        className="w-8 h-8 rounded-xl object-cover bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs text-purple-200">
                        Autor real: <b className="text-white">{round.authorName}</b> (@{round.authorNickname})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // VISTA PRINCIPAL: LISTA DE ENCUENTROS COMPLETADOS
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#1b143f] p-6 rounded-3xl border border-purple-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Archivo de Partidas
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold">
              <span className={`w-2 h-2 rounded-full ${isLoadingCloud ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}></span>
              {isLoadingCloud ? 'Sincronizando con la nube...' : 'Cloud Firestore Activo'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Historial de Encuentros
          </h1>
          <p className="text-xs sm:text-sm text-purple-300 mt-1">
            Explora las posiciones finales, los ganadores y las respuestas de cada sesión jugada en la nube.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsLoadingCloud(true);
              fetchCompletedEncuentrosHistoryFromCloud()
                .then(cloudList => {
                  if (cloudList && cloudList.length > 0) setHistoryList(cloudList);
                })
                .finally(() => setIsLoadingCloud(false));
            }}
            disabled={isLoadingCloud}
            title="Refrescar desde Cloud Firestore"
            className="px-3.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
          >
            <span className={isLoadingCloud ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </div>

      {/* List */}
      {historyList.length === 0 ? (
        <div className="bg-[#1b143f] border border-purple-500/30 rounded-3xl p-10 text-center shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/20 text-purple-300 mx-auto flex items-center justify-center text-3xl mb-4">
            📂
          </div>
          <h2 className="text-xl font-black text-white mb-2">
            No hay encuentros guardados todavía
          </h2>
          <p className="text-sm text-purple-300/80 max-w-md mx-auto mb-6">
            Juega una partida con tus amigos o familia. Al completarse, quedará registrada automáticamente aquí con su mosaico de puntuaciones y respuestas.
          </p>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ff007a] to-[#ff5900] text-white font-black text-sm shadow-lg transition"
          >
            Crear un Encuentro Ahora
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {historyList.map(enc => {
            const sorted = [...enc.players].sort((a, b) => b.score - a.score);
            const winner = sorted[0];

            return (
              <div
                key={enc.id}
                onClick={() => handleSelectEncuentro(enc)}
                className="bg-[#1b143f] hover:bg-[#221950] border-2 border-purple-500/30 hover:border-cyan-400/60 rounded-3xl p-5 sm:p-6 shadow-xl transition cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  {/* Winner avatar preview */}
                  <div className="relative shrink-0">
                    <img
                      src={winner?.avatarDataUrl || enc.players[0]?.avatarDataUrl}
                      alt="Ganador"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-white border-2 border-amber-400 shadow-md group-hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -top-2 -right-1 text-base">
                      👑
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-black tracking-wider">
                        {enc.code}
                      </span>
                      <span className="text-xs text-purple-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(enc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-white group-hover:text-cyan-300 transition">
                      {enc.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-purple-300 font-semibold">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-pink-400" />
                        {enc.players.length} jugadores
                      </span>
                      <span>•</span>
                      <span className="text-amber-300">
                        🏆 Campeón: <b>{winner?.name || 'Nadie'}</b> ({winner?.score || 0} pts)
                      </span>
                      <span>•</span>
                      <span>{enc.allAnswers.length} respuestas guardadas</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, enc.id)}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                    title="Eliminar del historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="px-4 py-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-black flex items-center gap-1.5 group-hover:bg-cyan-500 group-hover:text-black transition">
                    <span>Ver Mosaicos y Respuestas</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
