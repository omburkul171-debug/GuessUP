export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  points: number;
  gamesPlayed: number;
  gamesWon: number;
}

export type GameStatus = 'waiting' | 'selecting' | 'playing' | 'finished';

export interface GuessEntry {
  uid: string;
  guess: number;
  hint: 'Higher' | 'Lower' | 'Correct' | 'Very Close' | 'Far';
  timestamp: number;
}

export interface GameSession {
  id: string;
  player1: string;
  player2?: string;
  player1Name: string;
  player2Name?: string;
  player1Secret?: number;
  player2Secret?: number;
  status: GameStatus;
  turn?: string;
  history: GuessEntry[];
  winner?: string;
  createdAt: any;
  range: number;
}
