import React, { useState } from 'react';
import { UserPlus, LogIn, Sparkles, KeyRound, User as UserIcon, AtSign, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { getAllUsers, saveCurrentUser } from '../services/gameService';
import { sounds } from '../utils/audio';

interface AuthScreenProps {
  onAuthenticated: (user: User, isNewRegistration: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanNick = nickname.trim().replace(/\s+/g, '_').toLowerCase();

    if (!cleanName) {
      setError('Por favor ingresa tu nombre.');
      sounds.playBuzzer();
      return;
    }
    if (!cleanNick) {
      setError('Por favor ingresa un nickname válido.');
      sounds.playBuzzer();
      return;
    }
    if (cleanNick.length < 3) {
      setError('El nickname debe tener al menos 3 caracteres.');
      sounds.playBuzzer();
      return;
    }
    if (!password) {
      setError('Por favor ingresa una contraseña.');
      sounds.playBuzzer();
      return;
    }

    const allUsers = getAllUsers();
    if (allUsers[cleanNick]) {
      setError(`El nickname "@${cleanNick}" ya está en uso. Elige otro o inicia sesión.`);
      sounds.playBuzzer();
      return;
    }

    // Crear nuevo usuario provisional sin avatar (irá al Canvas)
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      nickname: cleanNick,
      password: password,
      avatarDataUrl: '', // Se generará en el Canvas
      createdAt: Date.now()
    };

    sounds.playSuccess();
    saveCurrentUser(newUser);
    onAuthenticated(newUser, true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNick = nickname.trim().toLowerCase();
    if (!cleanNick || !password) {
      setError('Por favor completa tu nickname y contraseña.');
      sounds.playBuzzer();
      return;
    }

    const allUsers = getAllUsers();
    const existing = allUsers[cleanNick];

    if (!existing) {
      setError(`No se encontró ninguna cuenta con el nickname "@${cleanNick}". Puedes registrarte.`);
      sounds.playBuzzer();
      return;
    }

    if (existing.password && existing.password !== password) {
      setError('Contraseña incorrecta. Por favor intenta de nuevo.');
      sounds.playBuzzer();
      return;
    }

    sounds.playSuccess();
    saveCurrentUser(existing);
    onAuthenticated(existing, false);
  };

  const handleQuickDemoUser = (demoName: string, demoNick: string) => {
    sounds.playPop();
    setName(demoName);
    setNickname(demoNick);
    setPassword('party123');
  };

  return (
    <div className="w-full max-w-md mx-auto my-4 sm:my-8 px-4">
      {/* Header Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-[#ff007a] via-[#7928ca] to-[#00d2ff] shadow-[0_0_30px_rgba(255,0,122,0.4)] mb-3 animate-bounce">
          <span className="text-4xl">🎨</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          ¡Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] via-[#ffd60a] to-[#00d2ff]">GetToKnowMe!</span>
        </h1>
        <p className="text-purple-200/80 text-sm mt-1">
          Dibuja tu avatar, responde preguntas disparatadas y adivina los secretos de tus amigos.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-[#1c1444]/90 backdrop-blur-md border-2 border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 bg-[#120e28] rounded-2xl mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsRegisterMode(true);
              setError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
              isRegisterMode
                ? 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white shadow-lg'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Registro
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsRegisterMode(false);
              setError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
              !isRegisterMode
                ? 'bg-gradient-to-r from-[#ff007a] to-[#7928ca] text-white shadow-lg'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Iniciar Sesión
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-pink-400" /> Nombre Completo
              </label>
              <input
                id="input-auth-name"
                type="text"
                placeholder="Ej. Carlos Mendoza"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#120e28] border border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:border-[#ff007a] focus:ring-2 focus:ring-[#ff007a]/40 text-sm transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-pink-400" /> Nickname (Usuario)
            </label>
            <input
              id="input-auth-nickname"
              type="text"
              placeholder="Ej. carlitos_pro"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-[#120e28] border border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:border-[#ff007a] focus:ring-2 focus:ring-[#ff007a]/40 text-sm transition"
            />
            {isRegisterMode && (
              <span className="text-[11px] text-purple-400 mt-1 block">
                Este apodo se usará para iniciar sesión y en los juegos.
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-pink-400" /> Contraseña
            </label>
            <input
              id="input-auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#120e28] border border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:border-[#ff007a] focus:ring-2 focus:ring-[#ff007a]/40 text-sm transition"
            />
          </div>

          {/* Submit Button */}
          <button
            id="btn-auth-submit"
            type="submit"
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff007a] via-[#ff5900] to-[#ffd60a] hover:opacity-95 active:scale-[0.98] text-white font-black text-base shadow-[0_4px_25px_rgba(255,0,122,0.4)] transition flex items-center justify-center gap-2"
          >
            {isRegisterMode ? (
              <>
                <span>Continuar y Dibujar Avatar</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar a Jugar</span>
              </>
            )}
          </button>
        </form>

        {/* Quick autofill suggestions for easy instant testing */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <span className="text-[11px] text-purple-300/80 uppercase tracking-wider font-semibold block mb-2">
            💡 ¿Probar rápido con un perfil de muestra?
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoUser('David Gómez', 'david_gamer')}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/15 text-purple-200 transition"
            >
              @david_gamer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoUser('Valeria Silva', 'vale_star')}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/15 text-purple-200 transition"
            >
              @vale_star
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
