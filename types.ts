
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  username: string; // Login principal
  name: string; // Nome de exibição
  email: string; // Recuperação e contato
  password?: string; // Armazenada para verificação
  role: UserRole;
  balance: number;
  pixKey?: string; 
  affiliateCode?: string; // Código único do usuário (ex: JOSIEL10)
  referredBy?: string; // ID de quem indicou
  referralCount?: number; // Quantas pessoas indicou
  isBlocked?: boolean; // Se true, não consegue logar
  
  // Controle de Jogo (Ciclo)
  spinCycleIndex?: number; // 0 a 14

  // Controle de Saque
  dailyWithdrawTotal?: number;
  lastWithdrawDate?: string; // YYYY-MM-DD
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'BET_WIN' | 'BET_LOSS' | 'BONUS_AFFILIATE' | 'BONUS_GAME';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  date: string;
  status: TransactionStatus;
  details?: string;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  date: string;
  status: 'PENDING' | 'RESOLVED';
}

export interface GameSettings {
  winRate: number; 
  winMultiplier: number; 
  maintenanceMode: boolean; // NOVO: Controle de Manutenção
}

export interface SpinResult {
    grid: string[]; // Array de 9 símbolos (3x3)
    win: boolean;
    amountWon: number;
    isBonus: boolean; // Se ativou a carta
    winningLines: number[]; // Índices que ganharam
}

export type View = 'HOME' | 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'DEPOSIT' | 'GAME' | 'WITHDRAW' | 'ADMIN';
