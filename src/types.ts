export interface Player {
  id: string;
  username: string;
  avatarUrl: string;
  platform: 'discord' | 'browser';
  score: number;
  online: boolean;
  lastSeen: number;
  joinedAt?: number;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  category?: string;
  difficulty?: string;
}

export interface GameState {
  bankLen: number;
  questionStart: number;
  slotDuration: number;
  startedAt: number;
}

export interface CurrentSlotInfo {
  slot: number;
  realSlot: number;
  index: number;
  question: Question;
  slotStart: number;
  slotEnd: number;
}

export interface AnswerRecord {
  answer: number;
  at: number;
}

export interface DiscordAuthResult {
  isDiscord: boolean;
  channelId: string;
  user: {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
    discriminator?: string;
  } | null;
}
