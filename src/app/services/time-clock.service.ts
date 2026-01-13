import { Injectable } from '@angular/core';
import { TimeEntry, PunchEntry, DailySummary } from '../models/time-entry.model';

@Injectable({
  providedIn: 'root'
})
export class TimeClockService {
  private readonly STORAGE_KEY = 'time-entries';
  private readonly USER_KEY = 'current-user';

  constructor() {}

  // Gerenciamento de usuário
  getCurrentUser(): { id: string; name: string } {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Usuário padrão
    const defaultUser = { id: '1', name: 'Usuário' };
    this.setCurrentUser(defaultUser);
    return defaultUser;
  }

  setCurrentUser(user: { id: string; name: string }): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Gerenciamento de batimentos
  getAllEntries(): TimeEntry[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  getTodayEntry(): TimeEntry | null {
    const today = this.getToday();
    const user = this.getCurrentUser();
    const entries = this.getAllEntries();
    return entries.find(e => e.date === today && e.userId === user.id) || null;
  }

  addPunch(type: PunchEntry['type'], notes?: string): PunchEntry {
    const user = this.getCurrentUser();
    const today = this.getToday();
    const entries = this.getAllEntries();
    
    let todayEntry = entries.find(e => e.date === today && e.userId === user.id);
    
    if (!todayEntry) {
      todayEntry = {
        id: this.generateId(),
        userId: user.id,
        userName: user.name,
        date: today,
        entries: []
      };
      entries.push(todayEntry);
    }

    const newPunch: PunchEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      type,
      notes
    };

    todayEntry.entries.push(newPunch);
    this.saveEntries(entries);
    
    return newPunch;
  }

  getLastPunchType(): PunchEntry['type'] | null {
    const todayEntry = this.getTodayEntry();
    if (!todayEntry || todayEntry.entries.length === 0) return null;
    return todayEntry.entries[todayEntry.entries.length - 1].type;
  }

  getTodaySummary(): DailySummary {
    const todayEntry = this.getTodayEntry();
    const today = this.getToday();
    
    if (!todayEntry || todayEntry.entries.length === 0) {
      return {
        date: today,
        totalWorked: 0,
        totalPause: 0
      };
    }

    const entries = todayEntry.entries.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp)
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let totalWorked = 0;
    let totalPause = 0;
    let workStart: Date | null = null;
    let pauseStart: Date | null = null;

    entries.forEach(entry => {
      if (entry.type === 'entrada') {
        workStart = entry.timestamp;
      } else if (entry.type === 'saida' && workStart) {
        totalWorked += (entry.timestamp.getTime() - workStart.getTime()) / 60000;
        workStart = null;
      } else if (entry.type === 'pausa-inicio') {
        pauseStart = entry.timestamp;
      } else if (entry.type === 'pausa-fim' && pauseStart) {
        totalPause += (entry.timestamp.getTime() - pauseStart.getTime()) / 60000;
        pauseStart = null;
      }
    });

    // Se ainda está trabalhando
    if (workStart) {
      const workTime = workStart as Date;
      totalWorked += (new Date().getTime() - workTime.getTime()) / 60000;
    }

    // Se ainda está em pausa
    if (pauseStart) {
      const pauseTime = pauseStart as Date;
      totalPause += (new Date().getTime() - pauseTime.getTime()) / 60000;
    }

    return {
      date: today,
      totalWorked: Math.floor(totalWorked),
      totalPause: Math.floor(totalPause),
      firstEntry: entries[0]?.timestamp,
      lastExit: entries[entries.length - 1]?.type === 'saida' ? entries[entries.length - 1].timestamp : undefined
    };
  }

  deletePunch(punchId: string): void {
    const entries = this.getAllEntries();
    const today = this.getToday();
    const user = this.getCurrentUser();
    
    const todayEntry = entries.find(e => e.date === today && e.userId === user.id);
    if (todayEntry) {
      todayEntry.entries = todayEntry.entries.filter(e => e.id !== punchId);
      this.saveEntries(entries);
    }
  }

  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private saveEntries(entries: TimeEntry[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
  }

  private getToday(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  }
}
