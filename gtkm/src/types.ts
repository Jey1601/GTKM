/**
 * Types for Guess Who Party game
 */

export interface User {
  id: string;
  name: string;
  nickname: string;
  password?: string;
  avatarDataUrl: string;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatarDataUrl: string;
  isHost: boolean;
  isBot?: boolean;
  score: number;
  hasAnsweredAll?: boolean;
}

export interface Question {
  id: string;
  text: string;
  category?: string;
}

export interface PlayerAnswer {
  questionId: string;
  questionText: string;
  playerId: string;
  playerNickname: string;
  playerName: string;
  playerAvatar: string;
  answerText: string;
}

export interface GuessWhoRound {
  id: string;
  questionId: string;
  questionText: string;
  authorId: string;
  authorNickname: string;
  authorName: string;
  authorAvatar: string;
  answerText: string;
  votes: Record<string, string>; // voterPlayerId -> guessedAuthorPlayerId
  revealed: boolean;
}

export type EncuentroStatus = 
  | 'lobby' 
  | 'answering' 
  | 'voting' 
  | 'reveal' 
  | 'leaderboard' 
  | 'history';

export interface Encuentro {
  id: string;
  code: string;
  hostId: string;
  title: string;
  status: EncuentroStatus;
  players: Player[];
  questions: Question[];
  allAnswers: PlayerAnswer[];
  guessWhoRounds: GuessWhoRound[];
  currentRoundIndex: number;
  totalSelectedRounds: number;
  createdAt: number;
  updatedAt: number;
}
