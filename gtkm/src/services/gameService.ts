/**
 * Game Service: State Management, Real-time Sync & 70% Round Selection Logic
 * 
 * ============================================================================
 * GUÍA DE INTEGRACIÓN FUTURA DE BACKEND (Firebase Firestore o Socket.io):
 * 
 * 1. PERSISTENCIA EN NUBE (Firebase Firestore):
 *    - Reemplazar las lecturas/escrituras de localStorage por:
 *      const docRef = doc(firestore, 'encuentros', encuentroCode);
 *      await setDoc(docRef, encuentroData, { merge: true });
 *    - En los clientes, suscribirse a cambios en tiempo real con:
 *      onSnapshot(docRef, (snapshot) => {
 *        if (snapshot.exists()) setEncuentro(snapshot.data() as Encuentro);
 *      });
 * 
 * 2. COMUNICACIÓN MULTIJUGADOR VÍA WEBSOCKETS (Socket.io / Node.js):
 *    - Reemplazar BroadcastChannel por eventos de socket:
 *      socket.emit('join_room', { roomCode, user });
 *      socket.emit('submit_answers', { roomCode, playerId, answers });
 *      socket.emit('submit_vote', { roomCode, voterId, targetPlayerId });
 *    - Escuchar actualizaciones del servidor:
 *      socket.on('encuentro_updated', (updatedEncuentro) => { ... });
 * ============================================================================
 */

import { Encuentro, Player, PlayerAnswer, GuessWhoRound, User } from '../types';
import { DEFAULT_QUESTION_PACKS } from '../data/questions';
import { SAMPLE_BOT_PLAYERS, createCuteAvatarSvg } from '../utils/mockAvatars';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  onSnapshot, 
  runTransaction,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const ENCUENTROS_KEY = 'gettoknowme_encuentros';
const CURRENT_USER_KEY = 'gettoknowme_current_user';
const USERS_DB_KEY = 'gettoknowme_users_db';
const COMPLETED_HISTORY_KEY = 'gettoknowme_completed_history';

// BroadcastChannel para sincronización instantánea entre pestañas abiertas en el mismo navegador
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('gettoknowme_party_channel')
  : null;

/**
 * Limpia recursivamente objetos para Firestore (elimina undefined)
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result;
}

// ==================== GESTIÓN DE USUARIOS ====================

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Error al obtener usuario actual', e);
    return null;
  }
}

export function saveCurrentUser(user: User): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    // Guardar en base de datos local de usuarios
    const users = getAllUsers();
    users[user.nickname.toLowerCase()] = user;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Persistir asíncronamente en Cloud Firestore
    const sanitized = sanitizeForFirestore({
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      avatarDataUrl: user.avatarDataUrl,
      createdAt: user.createdAt || Date.now()
    });
    setDoc(doc(db, 'users', user.id), sanitized, { merge: true }).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    });
  } catch (e) {
    console.error('Error al guardar usuario', e);
  }
}

export function getAllUsers(): Record<string, User> {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export async function loginUserAsync(
  nickname: string, 
  password?: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanNick = nickname.trim().toLowerCase();
  
  // 1. Verificar en caché local primero
  const allUsers = getAllUsers();
  const existingLocal = allUsers[cleanNick];
  if (existingLocal) {
    if (password && existingLocal.password && existingLocal.password !== password) {
      return { success: false, error: 'Contraseña incorrecta. Por favor intenta de nuevo.' };
    }
    saveCurrentUser(existingLocal);
    return { success: true, user: existingLocal };
  }

  // 2. Si no está en caché local, buscar en la colección de Firestore (para otros dispositivos)
  try {
    const q = query(collection(db, 'users'), where('nickname', '==', cleanNick));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const userData = snap.docs[0].data() as User;
      if (password && userData.password && userData.password !== password) {
        return { success: false, error: 'Contraseña incorrecta. Por favor intenta de nuevo.' };
      }
      saveCurrentUser(userData);
      return { success: true, user: userData };
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'users');
  }

  return { success: false, error: `No se encontró ninguna cuenta con el nickname "@${cleanNick}". Puedes registrarte.` };
}

export async function registerUserAsync(
  newUser: User
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanNick = newUser.nickname.trim().toLowerCase();

  // 1. Verificar en local
  const allUsers = getAllUsers();
  if (allUsers[cleanNick]) {
    return { success: false, error: `El nickname "@${cleanNick}" ya está en uso. Elige otro o inicia sesión.` };
  }

  // 2. Verificar en Firestore
  try {
    const q = query(collection(db, 'users'), where('nickname', '==', cleanNick));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { success: false, error: `El nickname "@${cleanNick}" ya está registrado. Elige otro o inicia sesión.` };
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'users');
  }

  saveCurrentUser(newUser);
  return { success: true, user: newUser };
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ==================== GESTIÓN DE ENCUENTROS ====================

export function getEncuentro(codeOrId: string): Encuentro | null {
  try {
    const raw = localStorage.getItem(ENCUENTROS_KEY);
    const encuentros: Record<string, Encuentro> = raw ? JSON.parse(raw) : {};
    const cleanCode = codeOrId.trim().toUpperCase();
    return encuentros[cleanCode] || Object.values(encuentros).find(e => e.id === codeOrId) || null;
  } catch (e) {
    console.error('Error al leer encuentro', e);
    return null;
  }
}

/**
 * Consulta un encuentro desde la nube (Firebase Firestore)
 */
export async function fetchEncuentroFromCloud(codeOrId: string): Promise<Encuentro | null> {
  try {
    const cleanCode = codeOrId.trim().toUpperCase();
    const docRef = doc(db, 'encuentros', cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Encuentro;
      saveEncuentroToLocalStorageAndSync(data);
      return data;
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `encuentros/${codeOrId}`);
  }
  return null;
}

export function saveEncuentroToLocalStorageAndSync(encuentro: Encuentro): void {
  try {
    const raw = localStorage.getItem(ENCUENTROS_KEY);
    const encuentros: Record<string, Encuentro> = raw ? JSON.parse(raw) : {};
    const updated = {
      ...encuentro,
      updatedAt: Date.now()
    };
    encuentros[encuentro.code.toUpperCase()] = updated;
    localStorage.setItem(ENCUENTROS_KEY, JSON.stringify(encuentros));

    if (syncChannel) {
      syncChannel.postMessage({ type: 'ENCUENTRO_UPDATED', code: encuentro.code });
    }
  } catch (e) {
    console.error('Error al guardar en caché local', e);
  }
}

export function saveEncuentro(encuentro: Encuentro): void {
  saveEncuentroToLocalStorageAndSync(encuentro);
  try {
    const sanitized = sanitizeForFirestore(encuentro);
    setDoc(doc(db, 'encuentros', encuentro.code.toUpperCase()), sanitized, { merge: true }).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `encuentros/${encuentro.code.toUpperCase()}`);
    });
  } catch (e) {
    console.error('Error al persistir en Firestore', e);
  }
}

/**
 * Genera un código único alfanumérico amigable de 6 caracteres (ej. "FIESTA", "AMIG07")
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Crea un nuevo Encuentro
 */
export function createEncuentro(
  hostUser: User, 
  packId: string = 'pack_amigos',
  customQuestionTexts?: string[],
  guessWhoPercentage: number = 70
): Encuentro {
  const code = generateRoomCode();
  const selectedPack = DEFAULT_QUESTION_PACKS.find(p => p.id === packId) || DEFAULT_QUESTION_PACKS[0];
  
  let questions = [...selectedPack.questions];
  if (customQuestionTexts && customQuestionTexts.length > 0) {
    const customQuestions = customQuestionTexts
      .filter(t => t.trim().length > 0)
      .map((text, i) => ({
        id: `custom_q_${i + 1}_${Date.now()}`,
        text: text.trim(),
        category: 'Personalizada'
      }));
    if (customQuestions.length > 0) {
      questions = customQuestions;
    }
  }

  const hostPlayer: Player = {
    id: hostUser.id,
    name: hostUser.name,
    nickname: hostUser.nickname,
    avatarDataUrl: hostUser.avatarDataUrl,
    isHost: true,
    score: 0,
    hasAnsweredAll: false
  };

  const clampedPercentage = Math.min(100, Math.max(10, Math.round(guessWhoPercentage || 70)));

  const nuevoEncuentro: Encuentro = {
    id: `enc_${Date.now()}_${code}`,
    code,
    hostId: hostUser.id,
    title: selectedPack.name,
    status: 'lobby',
    players: [hostPlayer],
    questions,
    allAnswers: [],
    guessWhoRounds: [],
    currentRoundIndex: 0,
    totalSelectedRounds: 0,
    guessWhoPercentage: clampedPercentage,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  saveEncuentro(nuevoEncuentro);
  return nuevoEncuentro;
}

/**
 * Actualiza configuraciones de la sala antes de iniciar (ej. porcentaje de Guess Who)
 */
export function updateEncuentroSettings(
  encuentroId: string, 
  settings: { guessWhoPercentage?: number; title?: string }
): Encuentro | null {
  const encuentro = getEncuentro(encuentroId);
  if (!encuentro) return null;

  if (settings.guessWhoPercentage !== undefined) {
    encuentro.guessWhoPercentage = Math.min(100, Math.max(10, Math.round(settings.guessWhoPercentage)));
  }
  if (settings.title) {
    encuentro.title = settings.title.trim();
  }

  saveEncuentro(encuentro);
  return encuentro;
}

/**
 * Une a un jugador a un encuentro existente (utiliza transacciones atómicas de Firestore para evitar colisiones con 12+ jugadores)
 */
export async function joinEncuentro(
  code: string, 
  user: User
): Promise<{ success: boolean; encuentro?: Encuentro; error?: string }> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: 'Por favor introduce un código de encuentro válido.' };
  }

  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let encuentroData: Encuentro;

      if (!snap.exists()) {
        const local = getEncuentro(cleanCode);
        if (local) {
          encuentroData = local;
        } else {
          return { success: false, error: 'No se encontró ningún encuentro con ese código. Verifica que esté bien escrito.' };
        }
      } else {
        encuentroData = snap.data() as Encuentro;
      }

      if (encuentroData.status !== 'lobby') {
        const existingPlayer = encuentroData.players.find(
          p => p.id === user.id || p.nickname.toLowerCase() === user.nickname.toLowerCase()
        );
        if (existingPlayer) {
          return { success: true, encuentro: encuentroData };
        }
        return { success: false, error: 'La partida de este encuentro ya ha comenzado.' };
      }

      const players = [...encuentroData.players];
      const existingIdx = players.findIndex(
        p => p.id === user.id || p.nickname.toLowerCase() === user.nickname.toLowerCase()
      );

      if (existingIdx >= 0) {
        players[existingIdx] = {
          ...players[existingIdx],
          name: user.name,
          nickname: user.nickname,
          avatarDataUrl: user.avatarDataUrl || players[existingIdx].avatarDataUrl
        };
      } else {
        players.push({
          id: user.id,
          name: user.name,
          nickname: user.nickname,
          avatarDataUrl: user.avatarDataUrl,
          isHost: false,
          score: 0,
          hasAnsweredAll: false
        });
      }

      const updatedEncuentro: Encuentro = {
        ...encuentroData,
        players,
        updatedAt: Date.now()
      };

      const sanitized = sanitizeForFirestore(updatedEncuentro);
      transaction.set(docRef, sanitized, { merge: true });

      return { success: true, encuentro: updatedEncuentro };
    });

    if (result.success && result.encuentro) {
      saveEncuentroToLocalStorageAndSync(result.encuentro);
    }
    return result;
  } catch (error) {
    console.warn('Transacción Firestore joinEncuentro reintentando fallback local', error);
    const local = getEncuentro(cleanCode);
    if (local) {
      const exists = local.players.some(p => p.id === user.id || p.nickname.toLowerCase() === user.nickname.toLowerCase());
      if (!exists && local.status === 'lobby') {
        local.players.push({
          id: user.id,
          name: user.name,
          nickname: user.nickname,
          avatarDataUrl: user.avatarDataUrl,
          isHost: false,
          score: 0,
          hasAnsweredAll: false
        });
        saveEncuentro(local);
      }
      return { success: true, encuentro: local };
    }
    return { success: false, error: 'Error de conexión con la sala. Por favor reintenta.' };
  }
}

/**
 * Añade jugadores simulados (Bots) para probar el juego en solitario de forma divertida e instantánea
 */
export async function addSampleBots(encuentroId: string): Promise<Encuentro | null> {
  const localEncuentro = getEncuentro(encuentroId);
  const cleanCode = (localEncuentro ? localEncuentro.code : encuentroId).trim().toUpperCase();
  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      const encuentroData: Encuentro = snap.exists() ? (snap.data() as Encuentro) : localEncuentro!;
      if (!encuentroData) return null;

      SAMPLE_BOT_PLAYERS.forEach((bot, index) => {
        const botId = `bot_${index}_${bot.nickname}`;
        const alreadyIn = encuentroData.players.some(p => p.id === botId || p.nickname === bot.nickname);
        if (!alreadyIn) {
          const avatarSvg = createCuteAvatarSvg(bot.color, bot.emoji, bot.faceType);
          encuentroData.players.push({
            id: botId,
            name: bot.name,
            nickname: bot.nickname,
            avatarDataUrl: avatarSvg,
            isHost: false,
            isBot: true,
            score: 0,
            hasAnsweredAll: false
          });
        }
      });

      encuentroData.updatedAt = Date.now();
      const sanitized = sanitizeForFirestore(encuentroData);
      transaction.set(docRef, sanitized, { merge: true });
      return encuentroData;
    });

    if (updated) {
      saveEncuentroToLocalStorageAndSync(updated);
      return updated;
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `encuentros/${cleanCode}`);
  }

  if (localEncuentro) {
    SAMPLE_BOT_PLAYERS.forEach((bot, index) => {
      const botId = `bot_${index}_${bot.nickname}`;
      const alreadyIn = localEncuentro.players.some(p => p.id === botId || p.nickname === bot.nickname);
      if (!alreadyIn) {
        const avatarSvg = createCuteAvatarSvg(bot.color, bot.emoji, bot.faceType);
        localEncuentro.players.push({
          id: botId,
          name: bot.name,
          nickname: bot.nickname,
          avatarDataUrl: avatarSvg,
          isHost: false,
          isBot: true,
          score: 0,
          hasAnsweredAll: false
        });
      }
    });
    saveEncuentro(localEncuentro);
    return localEncuentro;
  }
  return null;
}

/**
 * Inicia la partida desde el Lobby a la Fase de Preguntas (con transacción atómica)
 */
export async function startGame(encuentroId: string): Promise<Encuentro | null> {
  const localEncuentro = getEncuentro(encuentroId);
  const cleanCode = (localEncuentro ? localEncuentro.code : encuentroId).trim().toUpperCase();
  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      const encuentroData: Encuentro = snap.exists() ? (snap.data() as Encuentro) : localEncuentro!;
      if (!encuentroData) return null;

      encuentroData.status = 'answering';
      encuentroData.allAnswers = [];
      encuentroData.guessWhoRounds = [];
      encuentroData.currentRoundIndex = 0;

      // Resetear estados de respuesta de jugadores
      encuentroData.players.forEach(p => {
        p.hasAnsweredAll = false;
        p.score = 0;
      });

      // Generar respuestas automáticas para los bots en esta partida
      SAMPLE_BOT_PLAYERS.forEach((bot, botIdx) => {
        const botId = `bot_${botIdx}_${bot.nickname}`;
        const isBotPlayer = encuentroData.players.find(p => p.id === botId);
        if (isBotPlayer) {
          encuentroData.questions.forEach((q, qIdx) => {
            const botAnswersMap = bot.answers as Record<number, string>;
            const ansText = botAnswersMap[qIdx % 5] || `¡Respuesta divertida de ${bot.name}!`;
            encuentroData.allAnswers.push({
              questionId: q.id,
              questionText: q.text,
              playerId: botId,
              playerNickname: bot.nickname,
              playerName: bot.name,
              playerAvatar: isBotPlayer.avatarDataUrl,
              answerText: ansText
            });
          });
          isBotPlayer.hasAnsweredAll = true;
        }
      });

      encuentroData.updatedAt = Date.now();
      const sanitized = sanitizeForFirestore(encuentroData);
      transaction.set(docRef, sanitized, { merge: true });
      return encuentroData;
    });

    if (updated) {
      saveEncuentroToLocalStorageAndSync(updated);
      return updated;
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `encuentros/${cleanCode}`);
  }

  if (localEncuentro) {
    localEncuentro.status = 'answering';
    localEncuentro.allAnswers = [];
    localEncuentro.guessWhoRounds = [];
    localEncuentro.currentRoundIndex = 0;
    localEncuentro.players.forEach(p => {
      p.hasAnsweredAll = false;
      p.score = 0;
    });
    saveEncuentro(localEncuentro);
    return localEncuentro;
  }
  return null;
}

/**
 * LÓGICA PRINCIPAL DEL MODO "GUESS WHO" (ADIVINA QUIÉN):
 * Selecciona aleatoriamente el porcentaje configurado (por defecto 70%) del total de preguntas y respuestas.
 */
export function calculateAndBuildGuessWhoRounds(
  allAnswers: PlayerAnswer[], 
  percentage: number = 70
): GuessWhoRound[] {
  if (!allAnswers || allAnswers.length === 0) return [];

  // 1. Barajar respuestas aleatoriamente (Fisher-Yates)
  const shuffled = [...allAnswers].sort(() => Math.random() - 0.5);

  // 2. Calcular exactamente el porcentaje del total parametrizado (mínimo 1 ronda)
  const validPercentage = Math.min(100, Math.max(10, percentage || 70));
  const targetCount = Math.max(1, Math.ceil(allAnswers.length * (validPercentage / 100)));
  const selectedSubset = shuffled.slice(0, targetCount);

  // 3. Convertir en rondas de Guess Who
  return selectedSubset.map((item, index) => ({
    id: `round_${index + 1}_${Date.now()}`,
    questionId: item.questionId,
    questionText: item.questionText,
    authorId: item.playerId,
    authorNickname: item.playerNickname,
    authorName: item.playerName,
    authorAvatar: item.playerAvatar,
    answerText: item.answerText,
    votes: {},
    revealed: false
  }));
}

/**
 * Enviar respuestas de un jugador mediante transacción atómica.
 * Si todos los jugadores activos ya contestaron, se pasa automáticamente a 'voting'.
 */
export async function submitPlayerAnswers(
  encuentroId: string, 
  playerId: string, 
  answers: { questionId: string; answerText: string }[]
): Promise<Encuentro | null> {
  const localEncuentro = getEncuentro(encuentroId);
  const cleanCode = (localEncuentro ? localEncuentro.code : encuentroId).trim().toUpperCase();
  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let encuentroData: Encuentro;
      if (!snap.exists()) {
        if (!localEncuentro) return null;
        encuentroData = localEncuentro;
      } else {
        encuentroData = snap.data() as Encuentro;
      }

      const player = encuentroData.players.find(p => p.id === playerId);
      if (!player) {
        console.warn(`Jugador ${playerId} no encontrado en el encuentro`);
        return null;
      }

      // Filtrar respuestas previas de este jugador si existieran
      let updatedAllAnswers = (encuentroData.allAnswers || []).filter(a => a.playerId !== playerId);

      // Agregar las nuevas respuestas
      answers.forEach(ans => {
        const questionObj = encuentroData.questions.find(q => q.id === ans.questionId);
        if (questionObj) {
          updatedAllAnswers.push({
            questionId: questionObj.id,
            questionText: questionObj.text,
            playerId: player.id,
            playerNickname: player.nickname,
            playerName: player.name,
            playerAvatar: player.avatarDataUrl,
            answerText: ans.answerText.trim()
          });
        }
      });

      player.hasAnsweredAll = true;

      // Comprobar si el 100% de los jugadores ya contestó
      const allFinished = encuentroData.players.every(p => p.hasAnsweredAll);

      let nextStatus = encuentroData.status;
      let guessWhoRounds = encuentroData.guessWhoRounds || [];
      let totalSelectedRounds = encuentroData.totalSelectedRounds || 0;
      let currentRoundIndex = encuentroData.currentRoundIndex || 0;

      if (allFinished) {
        guessWhoRounds = calculateAndBuildGuessWhoRounds(
          updatedAllAnswers, 
          encuentroData.guessWhoPercentage ?? 70
        );
        totalSelectedRounds = guessWhoRounds.length;
        currentRoundIndex = 0;
        nextStatus = 'voting';
      }

      const updatedEncuentro: Encuentro = {
        ...encuentroData,
        allAnswers: updatedAllAnswers,
        players: encuentroData.players,
        guessWhoRounds,
        totalSelectedRounds,
        currentRoundIndex,
        status: nextStatus,
        updatedAt: Date.now()
      };

      const sanitized = sanitizeForFirestore(updatedEncuentro);
      transaction.set(docRef, sanitized, { merge: true });

      return updatedEncuentro;
    });

    if (updated) {
      saveEncuentroToLocalStorageAndSync(updated);
      return updated;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `encuentros/${cleanCode}`);
  }

  // Fallback local en caso de error de red
  if (localEncuentro) {
    const player = localEncuentro.players.find(p => p.id === playerId);
    if (player) {
      localEncuentro.allAnswers = localEncuentro.allAnswers.filter(a => a.playerId !== playerId);
      answers.forEach(ans => {
        const questionObj = localEncuentro.questions.find(q => q.id === ans.questionId);
        if (questionObj) {
          localEncuentro.allAnswers.push({
            questionId: questionObj.id,
            questionText: questionObj.text,
            playerId: player.id,
            playerNickname: player.nickname,
            playerName: player.name,
            playerAvatar: player.avatarDataUrl,
            answerText: ans.answerText.trim()
          });
        }
      });
      player.hasAnsweredAll = true;
      if (localEncuentro.players.every(p => p.hasAnsweredAll)) {
        localEncuentro.guessWhoRounds = calculateAndBuildGuessWhoRounds(
          localEncuentro.allAnswers, 
          localEncuentro.guessWhoPercentage ?? 70
        );
        localEncuentro.totalSelectedRounds = localEncuentro.guessWhoRounds.length;
        localEncuentro.currentRoundIndex = 0;
        localEncuentro.status = 'voting';
      }
      saveEncuentro(localEncuentro);
      return localEncuentro;
    }
  }

  return null;
}

/**
 * Función de escape para el Anfitrión: Avanzar a adivinanzas de inmediato
 * con las respuestas que hayan llegado hasta el momento si alguien se desconectó
 */
export async function forceAdvanceToVoting(encuentroId: string): Promise<Encuentro | null> {
  const localEncuentro = getEncuentro(encuentroId);
  const cleanCode = (localEncuentro ? localEncuentro.code : encuentroId).trim().toUpperCase();
  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      const encuentroData: Encuentro = snap.exists() ? (snap.data() as Encuentro) : localEncuentro!;
      if (!encuentroData || !encuentroData.allAnswers || encuentroData.allAnswers.length === 0) {
        return null;
      }

      const guessWhoRounds = calculateAndBuildGuessWhoRounds(
        encuentroData.allAnswers, 
        encuentroData.guessWhoPercentage ?? 70
      );

      const updatedEncuentro: Encuentro = {
        ...encuentroData,
        guessWhoRounds,
        totalSelectedRounds: guessWhoRounds.length,
        currentRoundIndex: 0,
        status: 'voting',
        updatedAt: Date.now()
      };

      const sanitized = sanitizeForFirestore(updatedEncuentro);
      transaction.set(docRef, sanitized, { merge: true });
      return updatedEncuentro;
    });

    if (updated) {
      saveEncuentroToLocalStorageAndSync(updated);
      return updated;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `encuentros/${cleanCode}`);
  }

  if (localEncuentro && localEncuentro.allAnswers && localEncuentro.allAnswers.length > 0) {
    localEncuentro.guessWhoRounds = calculateAndBuildGuessWhoRounds(
      localEncuentro.allAnswers, 
      localEncuentro.guessWhoPercentage ?? 70
    );
    localEncuentro.totalSelectedRounds = localEncuentro.guessWhoRounds.length;
    localEncuentro.currentRoundIndex = 0;
    localEncuentro.status = 'voting';
    saveEncuentro(localEncuentro);
    return localEncuentro;
  }
  return null;
}

/**
 * Registrar el voto de un jugador en la ronda actual (transaccional atómico)
 */
export async function submitVote(
  encuentroId: string, 
  voterPlayerId: string, 
  guessedAuthorPlayerId: string
): Promise<Encuentro | null> {
  const localEncuentro = getEncuentro(encuentroId);
  const cleanCode = (localEncuentro ? localEncuentro.code : encuentroId).trim().toUpperCase();
  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      const encuentroData: Encuentro = snap.exists() ? (snap.data() as Encuentro) : localEncuentro!;
      if (!encuentroData || !encuentroData.guessWhoRounds) return null;

      const currentRound = encuentroData.guessWhoRounds[encuentroData.currentRoundIndex];
      if (!currentRound) return null;

      if (!currentRound.votes) {
        currentRound.votes = {};
      }
      currentRound.votes[voterPlayerId] = guessedAuthorPlayerId;

      // Voto automático para bots si están presentes y aún no votaron
      encuentroData.players.forEach(p => {
        if (p.isBot && !currentRound.votes[p.id]) {
          const otherPlayers = encuentroData.players.filter(op => op.id !== p.id);
          if (otherPlayers.length > 0) {
            const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
            currentRound.votes[p.id] = randomTarget.id;
          }
        }
      });

      encuentroData.updatedAt = Date.now();
      const sanitized = sanitizeForFirestore(encuentroData);
      transaction.set(docRef, sanitized, { merge: true });
      return encuentroData;
    });

    if (updated) {
      saveEncuentroToLocalStorageAndSync(updated);
      return updated;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `encuentros/${cleanCode}`);
  }

  if (localEncuentro) {
    const currentRound = localEncuentro.guessWhoRounds[localEncuentro.currentRoundIndex];
    if (currentRound) {
      if (!currentRound.votes) currentRound.votes = {};
      currentRound.votes[voterPlayerId] = guessedAuthorPlayerId;
      saveEncuentro(localEncuentro);
      return localEncuentro;
    }
  }
  return null;
}

/**
 * Revelar el autor real de la ronda actual y calcular puntuaciones (transaccional)
 */
export async function revealCurrentRound(encuentroId: string): Promise<Encuentro | null> {
  const localEncuentro = getEncuentro(encuentroId);
  const cleanCode = (localEncuentro ? localEncuentro.code : encuentroId).trim().toUpperCase();
  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      const encuentroData: Encuentro = snap.exists() ? (snap.data() as Encuentro) : localEncuentro!;
      if (!encuentroData || !encuentroData.guessWhoRounds) return null;

      const currentRound = encuentroData.guessWhoRounds[encuentroData.currentRoundIndex];
      if (!currentRound || currentRound.revealed) return encuentroData;

      // Si algún jugador humano o bot no votó, asignar votos automáticos para que todos participen
      encuentroData.players.forEach(p => {
        if (!currentRound.votes) currentRound.votes = {};
        if (!currentRound.votes[p.id]) {
          const candidates = encuentroData.players;
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          currentRound.votes[p.id] = pick.id;
        }
      });

      currentRound.revealed = true;

      // Calcular puntos:
      // +100 puntos a quien adivine correctamente el autor
      // +25 puntos de bono al autor por cada persona engañada
      const realAuthorId = currentRound.authorId;
      let fooledCount = 0;

      encuentroData.players.forEach(player => {
        const voteTarget = currentRound.votes[player.id];
        if (player.id !== realAuthorId && voteTarget === realAuthorId) {
          player.score = (player.score || 0) + 100;
        } else if (player.id !== realAuthorId && voteTarget !== realAuthorId) {
          fooledCount++;
        }
      });

      const authorPlayer = encuentroData.players.find(p => p.id === realAuthorId);
      if (authorPlayer && fooledCount > 0) {
        authorPlayer.score = (authorPlayer.score || 0) + fooledCount * 25;
      }

      encuentroData.status = 'reveal';
      encuentroData.updatedAt = Date.now();

      const sanitized = sanitizeForFirestore(encuentroData);
      transaction.set(docRef, sanitized, { merge: true });
      return encuentroData;
    });

    if (updated) {
      saveEncuentroToLocalStorageAndSync(updated);
      return updated;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `encuentros/${cleanCode}`);
  }

  if (localEncuentro) {
    const currentRound = localEncuentro.guessWhoRounds[localEncuentro.currentRoundIndex];
    if (currentRound && !currentRound.revealed) {
      currentRound.revealed = true;
      localEncuentro.status = 'reveal';
      saveEncuentro(localEncuentro);
      return localEncuentro;
    }
  }
  return null;
}

// ==================== HISTORIAL DE ENCUENTROS REALIZADOS ====================

/**
 * Guarda un encuentro terminado en el historial persistente (Local + Cloud Firestore)
 */
export function saveEncuentroToHistory(encuentro: Encuentro): void {
  try {
    const raw = localStorage.getItem(COMPLETED_HISTORY_KEY);
    const historyList: Encuentro[] = raw ? JSON.parse(raw) : [];

    // Si ya existe por id o código, actualizarlo; si no, agregarlo al inicio
    const existingIndex = historyList.findIndex(e => e.id === encuentro.id || e.code === encuentro.code);
    const updatedRecord: Encuentro = {
      ...encuentro,
      updatedAt: Date.now()
    };

    if (existingIndex >= 0) {
      historyList[existingIndex] = updatedRecord;
    } else {
      historyList.unshift(updatedRecord);
    }

    localStorage.setItem(COMPLETED_HISTORY_KEY, JSON.stringify(historyList));

    if (syncChannel) {
      syncChannel.postMessage({ type: 'HISTORY_UPDATED' });
    }

    // Persistir en Cloud Firestore
    const sanitized = sanitizeForFirestore(updatedRecord);
    setDoc(doc(db, 'history', encuentro.id), sanitized, { merge: true }).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `history/${encuentro.id}`);
    });
  } catch (e) {
    console.error('Error al guardar historial de encuentro', e);
  }
}

/**
 * Obtiene todos los encuentros completados almacenados localmente
 */
export function getCompletedEncuentrosHistory(): Encuentro[] {
  try {
    const raw = localStorage.getItem(COMPLETED_HISTORY_KEY);
    const historyList: Encuentro[] = raw ? JSON.parse(raw) : [];
    return historyList;
  } catch (e) {
    console.error('Error al obtener historial', e);
    return [];
  }
}

/**
 * Descarga y sincroniza los encuentros históricos desde Cloud Firestore
 */
export async function fetchCompletedEncuentrosHistoryFromCloud(): Promise<Encuentro[]> {
  try {
    const snap = await getDocs(collection(db, 'history'));
    const cloudHistory: Encuentro[] = [];
    snap.forEach((docSnap) => {
      cloudHistory.push(docSnap.data() as Encuentro);
    });

    if (cloudHistory.length > 0) {
      // Ordenar por fecha de más reciente a más antiguo
      cloudHistory.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      localStorage.setItem(COMPLETED_HISTORY_KEY, JSON.stringify(cloudHistory));
      return cloudHistory;
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'history');
  }
  return getCompletedEncuentrosHistory();
}

/**
 * Elimina un encuentro del historial
 */
export function deleteEncuentroFromHistory(encuentroId: string): Encuentro[] {
  try {
    const historyList = getCompletedEncuentrosHistory().filter(e => e.id !== encuentroId);
    localStorage.setItem(COMPLETED_HISTORY_KEY, JSON.stringify(historyList));

    // Eliminar también de Cloud Firestore
    deleteDoc(doc(db, 'history', encuentroId)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `history/${encuentroId}`);
    });

    return historyList;
  } catch (e) {
    console.error('Error al eliminar del historial', e);
    return [];
  }
}

/**
 * Sembrar un encuentro inicial de muestra en el historial si está vacío
 */
export function seedInitialHistoryIfEmpty(): void {
  try {
    const existing = getCompletedEncuentrosHistory();
    if (existing.length > 0) return;

    // Crear un encuentro histórico de muestra para demostración inmediata
    const samplePlayers: Player[] = [
      {
        id: 'hist_p1',
        name: 'David Gómez',
        nickname: 'david_gamer',
        avatarDataUrl: createCuteAvatarSvg('#00d2ff', '🎮', 0),
        isHost: true,
        score: 350,
        hasAnsweredAll: true
      },
      {
        id: 'hist_p2',
        name: 'Sofi Ruiz',
        nickname: 'sofi_party',
        avatarDataUrl: createCuteAvatarSvg('#ff007a', '🦄', 0),
        isHost: false,
        score: 400,
        hasAnsweredAll: true
      },
      {
        id: 'hist_p3',
        name: 'Mateo Gómez',
        nickname: 'mateito99',
        avatarDataUrl: createCuteAvatarSvg('#ffd60a', '🍕', 1),
        isHost: false,
        score: 250,
        hasAnsweredAll: true
      },
      {
        id: 'hist_p4',
        name: 'Camila Torres',
        nickname: 'cami_vibes',
        avatarDataUrl: createCuteAvatarSvg('#30d158', '🚀', 2),
        isHost: false,
        score: 150,
        hasAnsweredAll: true
      }
    ];

    const sampleQuestions = [
      { id: 'q1', text: '¿Cuál es el momento más vergonzoso que recuerdas haber pasado en público?', category: 'Anécdotas' },
      { id: 'q2', text: 'Si ganaras 1 millón de dólares mañana, ¿cuál es la primera compra absurda que harías?', category: 'Fantasía' },
      { id: 'q3', text: '¿Qué comida todo el mundo ama pero a ti te parece horrible?', category: 'Gustos' },
      { id: 'q4', text: 'Si fueras arrestado sin dar explicaciones, ¿qué crimen asumirían tus amigos?', category: 'Travesuras' }
    ];

    const sampleAnswers: PlayerAnswer[] = [
      {
        questionId: 'q1',
        questionText: sampleQuestions[0].text,
        playerId: 'hist_p1',
        playerName: 'David Gómez',
        playerNickname: 'david_gamer',
        playerAvatar: samplePlayers[0].avatarDataUrl,
        answerText: 'Fui a una boda con zapatos de diferente color y no me di cuenta hasta el baile nupcial.'
      },
      {
        questionId: 'q2',
        questionText: sampleQuestions[1].text,
        playerId: 'hist_p1',
        playerName: 'David Gómez',
        playerNickname: 'david_gamer',
        playerAvatar: samplePlayers[0].avatarDataUrl,
        answerText: 'Comprarme una sala de arcade retro de los años 90 con máquinas originales de Street Fighter.'
      },
      {
        questionId: 'q3',
        questionText: sampleQuestions[2].text,
        playerId: 'hist_p1',
        playerName: 'David Gómez',
        playerNickname: 'david_gamer',
        playerAvatar: samplePlayers[0].avatarDataUrl,
        answerText: 'La mayonesa en exceso, siento que arruina cualquier comida.'
      },
      {
        questionId: 'q4',
        questionText: sampleQuestions[3].text,
        playerId: 'hist_p1',
        playerName: 'David Gómez',
        playerNickname: 'david_gamer',
        playerAvatar: samplePlayers[0].avatarDataUrl,
        answerText: 'Quedarme atrapado de noche en un centro comercial por quedarme jugando videojuegos.'
      },
      // Sofi
      {
        questionId: 'q1',
        questionText: sampleQuestions[0].text,
        playerId: 'hist_p2',
        playerName: 'Sofi Ruiz',
        playerNickname: 'sofi_party',
        playerAvatar: samplePlayers[1].avatarDataUrl,
        answerText: 'Traté de cantar en un karaoke y se me cayó el micrófono adentro del vaso del DJ.'
      },
      {
        questionId: 'q2',
        questionText: sampleQuestions[1].text,
        playerId: 'hist_p2',
        playerName: 'Sofi Ruiz',
        playerNickname: 'sofi_party',
        playerAvatar: samplePlayers[1].avatarDataUrl,
        answerText: 'Un tobogán inflable de agua gigante de 3 pisos conectado desde mi balcón al patio.'
      },
      {
        questionId: 'q3',
        questionText: sampleQuestions[2].text,
        playerId: 'hist_p2',
        playerName: 'Sofi Ruiz',
        playerNickname: 'sofi_party',
        playerAvatar: samplePlayers[1].avatarDataUrl,
        answerText: 'El aguacate/palta, no soporto su textura.'
      },
      {
        questionId: 'q4',
        questionText: sampleQuestions[3].text,
        playerId: 'hist_p2',
        playerName: 'Sofi Ruiz',
        playerNickname: 'sofi_party',
        playerAvatar: samplePlayers[1].avatarDataUrl,
        answerText: 'Robarme un perrito callejero para darle mimos y adoptarlo sin permiso.'
      },
      // Mateo
      {
        questionId: 'q1',
        questionText: sampleQuestions[0].text,
        playerId: 'hist_p3',
        playerName: 'Mateo Gómez',
        playerNickname: 'mateito99',
        playerAvatar: samplePlayers[2].avatarDataUrl,
        answerText: 'Saludé con un abrazo muy efusivo a un maniquí en una tienda pensando que era mi primo.'
      },
      {
        questionId: 'q2',
        questionText: sampleQuestions[1].text,
        playerId: 'hist_p3',
        playerName: 'Mateo Gómez',
        playerNickname: 'mateito99',
        playerAvatar: samplePlayers[2].avatarDataUrl,
        answerText: 'Una estatua dorada de tamaño real de mi gato con ojos de rubí.'
      },
      {
        questionId: 'q3',
        questionText: sampleQuestions[2].text,
        playerId: 'hist_p3',
        playerName: 'Mateo Gómez',
        playerNickname: 'mateito99',
        playerAvatar: samplePlayers[2].avatarDataUrl,
        answerText: 'El sushi... jamás entenderé comer pescado frío.'
      },
      {
        questionId: 'q4',
        questionText: sampleQuestions[3].text,
        playerId: 'hist_p3',
        playerName: 'Mateo Gómez',
        playerNickname: 'mateito99',
        playerAvatar: samplePlayers[2].avatarDataUrl,
        answerText: 'Hackear las luces de la ciudad para poner todas las esquinas en luz verde.'
      },
      // Camila
      {
        questionId: 'q1',
        questionText: sampleQuestions[0].text,
        playerId: 'hist_p4',
        playerName: 'Camila Torres',
        playerNickname: 'cami_vibes',
        playerAvatar: samplePlayers[3].avatarDataUrl,
        answerText: 'Entré por error al baño de hombres en el cine y salí corriendo gritando perdón.'
      },
      {
        questionId: 'q2',
        questionText: sampleQuestions[1].text,
        playerId: 'hist_p4',
        playerName: 'Camila Torres',
        playerNickname: 'cami_vibes',
        playerAvatar: samplePlayers[3].avatarDataUrl,
        answerText: 'Un jetpack personal de turbinas para saltarme todo el tráfico matutino.'
      },
      {
        questionId: 'q3',
        questionText: sampleQuestions[2].text,
        playerId: 'hist_p4',
        playerName: 'Camila Torres',
        playerNickname: 'cami_vibes',
        playerAvatar: samplePlayers[3].avatarDataUrl,
        answerText: 'El chocolate amargo al 90%, sabe a pura tierra.'
      },
      {
        questionId: 'q4',
        questionText: sampleQuestions[3].text,
        playerId: 'hist_p4',
        playerName: 'Camila Torres',
        playerNickname: 'cami_vibes',
        playerAvatar: samplePlayers[3].avatarDataUrl,
        answerText: 'Haber organizado una fiesta clandestina con música disco adentro de una biblioteca.'
      }
    ];

    const sampleRounds: GuessWhoRound[] = [
      {
        id: 's_r1',
        questionId: 'q1',
        questionText: sampleQuestions[0].text,
        authorId: 'hist_p2',
        authorNickname: 'sofi_party',
        authorName: 'Sofi Ruiz',
        authorAvatar: samplePlayers[1].avatarDataUrl,
        answerText: 'Traté de cantar en un karaoke y se me cayó el micrófono adentro del vaso del DJ.',
        votes: { hist_p1: 'hist_p2', hist_p3: 'hist_p4', hist_p4: 'hist_p2' },
        revealed: true
      },
      {
        id: 's_r2',
        questionId: 'q2',
        questionText: sampleQuestions[1].text,
        authorId: 'hist_p3',
        authorNickname: 'mateito99',
        authorName: 'Mateo Gómez',
        authorAvatar: samplePlayers[2].avatarDataUrl,
        answerText: 'Una estatua dorada de tamaño real de mi gato con ojos de rubí.',
        votes: { hist_p1: 'hist_p3', hist_p2: 'hist_p3', hist_p4: 'hist_p1' },
        revealed: true
      }
    ];

    const demoCompletedEncuentro: Encuentro = {
      id: 'enc_hist_demo_01',
      code: 'FIESTA',
      hostId: 'hist_p1',
      title: 'Anécdotas y Momentos Épicos (Edición de Noche)',
      status: 'history',
      players: samplePlayers,
      questions: sampleQuestions,
      allAnswers: sampleAnswers,
      guessWhoRounds: sampleRounds,
      currentRoundIndex: 1,
      totalSelectedRounds: 2,
      guessWhoPercentage: 70,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2
    };

    saveEncuentroToHistory(demoCompletedEncuentro);
  } catch (e) {
    console.error('Error al sembrar historial', e);
  }
}

/**
 * Avanzar a la siguiente ronda o pasar al podio / tabla de posiciones (transaccional)
 */
export async function advanceToNextRoundOrLeaderboard(encuentroId: string): Promise<Encuentro | null> {
  const localEncuentro = getEncuentro(encuentroId);
  const cleanCode = (localEncuentro ? localEncuentro.code : encuentroId).trim().toUpperCase();
  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      const encuentroData: Encuentro = snap.exists() ? (snap.data() as Encuentro) : localEncuentro!;
      if (!encuentroData) return null;

      if (encuentroData.currentRoundIndex + 1 < (encuentroData.guessWhoRounds?.length || 0)) {
        encuentroData.currentRoundIndex += 1;
        encuentroData.status = 'voting';
      } else {
        encuentroData.status = 'leaderboard';
      }

      encuentroData.updatedAt = Date.now();
      const sanitized = sanitizeForFirestore(encuentroData);
      transaction.set(docRef, sanitized, { merge: true });
      return encuentroData;
    });

    if (updated) {
      if (updated.status === 'leaderboard') {
        saveEncuentroToHistory(updated);
      }
      saveEncuentroToLocalStorageAndSync(updated);
      return updated;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `encuentros/${cleanCode}`);
  }

  if (localEncuentro) {
    if (localEncuentro.currentRoundIndex + 1 < localEncuentro.guessWhoRounds.length) {
      localEncuentro.currentRoundIndex += 1;
      localEncuentro.status = 'voting';
    } else {
      localEncuentro.status = 'leaderboard';
      saveEncuentroToHistory(localEncuentro);
    }
    saveEncuentro(localEncuentro);
    return localEncuentro;
  }
  return null;
}

/**
 * Ver resumen e historial completo del encuentro
 */
export function viewEncuentroHistory(encuentroId: string): Encuentro | null {
  const encuentro = getEncuentro(encuentroId);
  if (!encuentro) return null;

  encuentro.status = 'history';
  saveEncuentroToHistory(encuentro);
  saveEncuentro(encuentro);
  return encuentro;
}

/**
 * Reiniciar partida para volver a jugar (transaccional)
 */
export async function restartEncuentroGame(encuentroId: string): Promise<Encuentro | null> {
  const localEncuentro = getEncuentro(encuentroId);
  const cleanCode = (localEncuentro ? localEncuentro.code : encuentroId).trim().toUpperCase();
  const docRef = doc(db, 'encuentros', cleanCode);

  try {
    const updated = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      const encuentroData: Encuentro = snap.exists() ? (snap.data() as Encuentro) : localEncuentro!;
      if (!encuentroData) return null;

      encuentroData.status = 'lobby';
      encuentroData.allAnswers = [];
      encuentroData.guessWhoRounds = [];
      encuentroData.currentRoundIndex = 0;
      encuentroData.totalSelectedRounds = 0;
      encuentroData.players.forEach(p => {
        p.hasAnsweredAll = false;
        p.score = 0;
      });

      encuentroData.updatedAt = Date.now();
      const sanitized = sanitizeForFirestore(encuentroData);
      transaction.set(docRef, sanitized, { merge: true });
      return encuentroData;
    });

    if (updated) {
      saveEncuentroToLocalStorageAndSync(updated);
      return updated;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `encuentros/${cleanCode}`);
  }

  if (localEncuentro) {
    localEncuentro.status = 'lobby';
    localEncuentro.allAnswers = [];
    localEncuentro.guessWhoRounds = [];
    localEncuentro.currentRoundIndex = 0;
    localEncuentro.totalSelectedRounds = 0;
    localEncuentro.players.forEach(p => {
      p.hasAnsweredAll = false;
      p.score = 0;
    });
    saveEncuentro(localEncuentro);
    return localEncuentro;
  }
  return null;
}

/**
 * Hook helper para suscribirse a cambios de encuentro en tiempo real (BroadcastChannel + Cloud Firestore onSnapshot)
 */
export function subscribeToEncuentroUpdates(callback: (code: string) => void, activeRoomCode?: string): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'ENCUENTRO_UPDATED') {
      callback(event.data.code);
    }
  };

  const storageHandler = (event: StorageEvent) => {
    if (event.key === ENCUENTROS_KEY) {
      callback('');
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handler);
  }
  window.addEventListener('storage', storageHandler);

  // Escuchar en tiempo real en Cloud Firestore si hay una sala activa
  let unsubscribeFirestore: (() => void) | null = null;
  if (activeRoomCode) {
    const cleanCode = activeRoomCode.trim().toUpperCase();
    try {
      const docRef = doc(db, 'encuentros', cleanCode);
      unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Encuentro;
          try {
            const raw = localStorage.getItem(ENCUENTROS_KEY);
            const encuentros: Record<string, Encuentro> = raw ? JSON.parse(raw) : {};
            encuentros[cleanCode] = data;
            localStorage.setItem(ENCUENTROS_KEY, JSON.stringify(encuentros));
          } catch (e) {
            // ignore
          }
          callback(cleanCode);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `encuentros/${cleanCode}`);
      });
    } catch (e) {
      console.warn('No se pudo suscribir a Firestore snapshot', e);
    }
  }

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handler);
    }
    window.removeEventListener('storage', storageHandler);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}
