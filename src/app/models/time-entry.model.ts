export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
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
