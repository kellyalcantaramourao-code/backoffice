export interface User {
  id: string;
  nome: string;
  servidor: string;
  nickname: string;
  email: string;
  senha: string;
  role: 'employee' | 'manager';
  lastLogin?: Date;
  suspended?: boolean;
  suspendedReason?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string; // nickname
  date: string; // YYYY-MM-DD
  entries: PunchEntry[];
}

export interface PunchEntry {
  id: string;
  timestamp: Date;
  type: 'entrada' | 'saida' | 'pausa-inicio' | 'pausa-fim';
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface DailySummary {
  date: string;
  totalWorked: number; // em minutos
  totalPause: number; // em minutos
  firstEntry?: Date;
  lastExit?: Date;
}
