/**
 * Guess Who Party - Interactive Multiplayer Party Game
 * Style: Kahoot / Jackbox Games
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Encuentro } from './types';
import { 
  getCurrentUser, 
  saveCurrentUser, 
  logoutUser, 
  getEncuentro, 
  subscribeToEncuentroUpdates, 
  getAllUsers,
  seedInitialHistoryIfEmpty
} from './services/gameService';
import { createCuteAvatarSvg } from './utils/mockAvatars';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { AvatarCanvas } from './components/AvatarCanvas';
import { Dashboard } from './components/Dashboard';
import { Lobby } from './components/Lobby';
import { QuestionPhase } from './components/QuestionPhase';
import { GuessWhoVoting } from './components/GuessWhoVoting';
import { RoundReveal } from './components/RoundReveal';
import { Leaderboard } from './components/Leaderboard';
import { SessionHistory } from './components/SessionHistory';
import { ProfileModal } from './components/ProfileModal';
import { EncuentrosHistoryView } from './components/EncuentrosHistoryView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialDrawing, setIsInitialDrawing] = useState(false);
  const [currentEncuentro, setCurrentEncuentro] = useState<Encuentro | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // Inicializar usuario desde localStorage y sembrar usuarios demo e historial si es la primera vez
  useEffect(() => {
    // Sembrar historial inicial si está vacío
    seedInitialHistoryIfEmpty();

    // Si no existen usuarios en la base local, inicializar algunos de muestra para pruebas rápidas
    const existingUsers = getAllUsers();
    if (Object.keys(existingUsers).length === 0) {
      const demoUser1: User = {
        id: 'usr_demo_1',
        name: 'David Gómez',
        nickname: 'david_gamer',
        password: 'party123',
        avatarDataUrl: createCuteAvatarSvg('#00d2ff', '🎮', 0),
        createdAt: Date.now()
      };
      const demoUser2: User = {
        id: 'usr_demo_2',
        name: 'Valeria Silva',
        nickname: 'vale_star',
        password: 'party123',
        avatarDataUrl: createCuteAvatarSvg('#ff007a', '⭐', 1),
        createdAt: Date.now()
      };
      saveCurrentUser(demoUser1);
      saveCurrentUser(demoUser2);
    }

    const savedUser = getCurrentUser();
    if (savedUser) {
      // Si el usuario no tiene avatar aún, mandar a dibujar
      if (!savedUser.avatarDataUrl) {
        setCurrentUser(savedUser);
        setIsInitialDrawing(true);
      } else {
        setCurrentUser(savedUser);
      }
    }
  }, []);

  // Suscribirse a actualizaciones en tiempo real (BroadcastChannel y Cloud Firestore onSnapshot)
  useEffect(() => {
    const unsubscribe = subscribeToEncuentroUpdates((code) => {
      if (currentEncuentro) {
        const targetCode = code || currentEncuentro.code;
        const refreshed = getEncuentro(targetCode);
        if (refreshed) {
          setCurrentEncuentro(refreshed);
        }
      }
    }, currentEncuentro?.code);
    return () => unsubscribe();
  }, [currentEncuentro?.code]);

  // Manejo de autenticación exitosa
  const handleAuthenticated = (user: User, isNewRegistration: boolean) => {
    setCurrentUser(user);
    if (isNewRegistration || !user.avatarDataUrl) {
      setIsInitialDrawing(true);
    }
  };

  // Guardar avatar dibujado en el Canvas tras registro
  const handleSaveInitialAvatar = (avatarDataUrl: string) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      avatarDataUrl
    };
    saveCurrentUser(updated);
    setCurrentUser(updated);
    setIsInitialDrawing(false);
  };

  // Cerrar sesión
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentEncuentro(null);
    setIsInitialDrawing(false);
  };

  // Salir de una sala para volver al dashboard
  const handleLeaveEncuentro = () => {
    setCurrentEncuentro(null);
  };

  // Actualizar encuentro
  const handleEncuentroUpdated = (updated: Encuentro) => {
    setCurrentEncuentro(updated);
  };

  return (
    <div className="min-h-screen bg-[#120e28] text-white flex flex-col font-sans selection:bg-[#ff007a] selection:text-white relative overflow-x-hidden">
      {/* Background ambient lighting effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#ff007a]/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-[#00d2ff]/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-10 w-72 h-72 bg-[#ffd60a]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header Navigation */}
      <Navbar
        currentUser={currentUser}
        currentEncuentro={currentEncuentro}
        onEditAvatar={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        onLeaveEncuentro={currentEncuentro ? handleLeaveEncuentro : undefined}
        onOpenHistory={() => {
          setCurrentEncuentro(null);
          setIsViewingHistory(true);
        }}
      />

      {/* Main App Content Flow */}
      <main className="flex-1 flex flex-col justify-center items-center py-4 sm:py-8 px-2">
        <AnimatePresence mode="wait">
          {/* 1. Flujo No Autenticado */}
          {!currentUser ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <AuthScreen onAuthenticated={handleAuthenticated} />
            </motion.div>
          ) : isInitialDrawing ? (
            /* 2. Pantalla de dibujo del Avatar tras primer registro */
            <motion.div
              key="canvas-initial"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="w-full px-4"
            >
              <AvatarCanvas
                onSave={handleSaveInitialAvatar}
                title="¡Dibuja tu Avatar de Juego!"
                subtitle={`Hola ${currentUser.name}, dibuja tu cara, un monstruo o un ícono que te representará ante tus amigos.`}
              />
            </motion.div>
          ) : isViewingHistory && !currentEncuentro ? (
            /* 3. Pantalla de Historial de Encuentros (Mosaico de posiciones y respuestas) */
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <EncuentrosHistoryView
                onBackToDashboard={() => setIsViewingHistory(false)}
              />
            </motion.div>
          ) : !currentEncuentro ? (
            /* 4. Dashboard Principal (Crear / Unirse a Encuentro) */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <Dashboard
                currentUser={currentUser}
                onEnterEncuentro={enc => {
                  setIsViewingHistory(false);
                  setCurrentEncuentro(enc);
                }}
                onEditAvatar={() => setShowProfileModal(true)}
                onViewHistory={() => setIsViewingHistory(true)}
              />
            </motion.div>
          ) : (
            /* 5. Flujo del Encuentro según su Estado */
            <motion.div
              key={`encuentro-${currentEncuentro.status}-${currentEncuentro.currentRoundIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {currentEncuentro.status === 'lobby' && (
                <Lobby
                  encuentro={currentEncuentro}
                  currentUser={currentUser}
                  onEncuentroUpdated={handleEncuentroUpdated}
                />
              )}

              {currentEncuentro.status === 'answering' && (
                <QuestionPhase
                  encuentro={currentEncuentro}
                  currentUser={currentUser}
                  onEncuentroUpdated={handleEncuentroUpdated}
                />
              )}

              {currentEncuentro.status === 'voting' && (
                <GuessWhoVoting
                  encuentro={currentEncuentro}
                  currentUser={currentUser}
                  onEncuentroUpdated={handleEncuentroUpdated}
                />
              )}

              {currentEncuentro.status === 'reveal' && (
                <RoundReveal
                  encuentro={currentEncuentro}
                  currentUser={currentUser}
                  onEncuentroUpdated={handleEncuentroUpdated}
                />
              )}

              {currentEncuentro.status === 'leaderboard' && (
                <Leaderboard
                  encuentro={currentEncuentro}
                  currentUser={currentUser}
                  onEncuentroUpdated={handleEncuentroUpdated}
                />
              )}

              {currentEncuentro.status === 'history' && (
                <SessionHistory
                  encuentro={currentEncuentro}
                  onRestart={handleEncuentroUpdated}
                  onGoHome={handleLeaveEncuentro}
                  onViewAllHistory={() => {
                    setCurrentEncuentro(null);
                    setIsViewingHistory(true);
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal para editar perfil o avatar */}
      {showProfileModal && currentUser && (
        <ProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={updated => setCurrentUser(updated)}
        />
      )}

      {/* Subtle Footer */}
      <footer className="w-full py-4 text-center text-xs text-purple-400/60 border-t border-purple-900/30">
        <p>GetToKnowMe 🎭 Diseñado para amigos y familia • Estilo Jackbox & Kahoot</p>
      </footer>
    </div>
  );
}
