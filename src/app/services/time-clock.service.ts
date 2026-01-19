import { Injectable } from '@angular/core';
import { TimeEntry, PunchEntry, DailySummary, User } from '../models/time-entry.model';

@Injectable({
  providedIn: 'root'
})
export class TimeClockService {
  private readonly STORAGE_KEY = 'time-entries';
  private readonly USER_KEY = 'current-user';
  private readonly USERS_KEY = 'users';

  constructor() {
    this.initializeDefaultManager();
  }

  private initializeDefaultManager(): void {
    const users = this.getAllUsers();
    if (!users.some(u => u.role === 'manager')) {
      const manager: User = {
        id: 'manager-1',
        nome: 'Gerente',
        servidor: 'Sistema',
        nickname: 'gerente',
        email: 'gerente@sistema.com',
        senha: 'admin123',
        role: 'manager',
        lastLogin: new Date(),
        suspended: false
      };
      users.push(manager);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }
  }

  // Gerenciamento de usuários
  getAllUsers(): User[] {
    const stored = localStorage.getItem(this.USERS_KEY);
    if (!stored) return [];
    
    try {
      const users = JSON.parse(stored);
      // Garantir que todos os usuários tenham as propriedades necessárias
      return users.map((user: any) => ({
        ...user,
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
        suspended: user.suspended || false,
        role: user.role || 'employee'
      }));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      return [];
    }
  }

  registerUser(userData: Omit<User, 'id' | 'role' | 'lastLogin' | 'suspended'>): User {
    const users = this.getAllUsers();
    
    // Check if email or nickname already exists
    if (users.some(u => u.email === userData.email || u.nickname === userData.nickname)) {
      throw new Error('Email ou nickname já cadastrado');
    }

    const newUser: User = {
      id: this.generateId(),
      ...userData,
      role: 'employee',
      lastLogin: new Date(),
      suspended: false
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return newUser;
  }

  login(nicknameOrEmail: string, password: string): User | null {
    const users = this.getAllUsers();
    const user = users.find(u => 
      (u.nickname === nicknameOrEmail || u.email === nicknameOrEmail) && u.senha === password
    );
    
    if (user) {
      // Verificar se usuário está suspenso
      if (this.isUserSuspended(user)) {
        throw new Error('Sua conta está suspensa devido a inatividade. Entre em contato com o gerente.');
      }
      
      // Atualizar último login
      user.lastLogin = new Date();
      this.saveUsers(users);
    }
    
    return user || null;
  }

  // Gerenciamento de usuário atual
  getCurrentUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Verificar se é gerente
  isManager(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'manager';
  }

  // Obter relatório de todos os funcionários (apenas para gerente)
  getAllEmployeesReport(): { 
    user: User; 
    today: { totalWorked: number; totalPause: number; daysWorked: number };
    thisMonth: { totalWorked: number; totalPause: number; daysWorked: number };
    thisYear: { totalWorked: number; totalPause: number; daysWorked: number };
  }[] {
    if (!this.isManager()) return [];

    const users = this.getAllUsers().filter(u => u.role === 'employee');
    const entries = this.getAllEntries();
    const now = new Date();
    const today = this.getToday();
    const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const thisYear = now.getFullYear().toString();

    return users.map(user => {
      const userEntries = entries.filter(e => e.userId === user.id);
      
      const todayData = this.calculatePeriodData(userEntries.filter(e => e.date === today));
      const monthData = this.calculatePeriodData(userEntries.filter(e => e.date.startsWith(thisMonth)));
      const yearData = this.calculatePeriodData(userEntries.filter(e => e.date.startsWith(thisYear)));

      return {
        user,
        today: todayData,
        thisMonth: monthData,
        thisYear: yearData
      };
    });
  }

  private calculatePeriodData(entries: TimeEntry[]): { totalWorked: number; totalPause: number; daysWorked: number } {
    let totalWorked = 0;
    let totalPause = 0;
    let daysWorked = 0;

    entries.forEach(entry => {
      const summary = this.getSummaryForEntry(entry);
      if (summary.totalWorked > 0) {
        totalWorked += summary.totalWorked;
        totalPause += summary.totalPause;
        daysWorked += 1;
      }
    });

    return {
      totalWorked,
      totalPause,
      daysWorked
    };
  }

  // Gerenciamento de suspensão de usuários
  isUserSuspended(user: User): boolean {
    if (user.role === 'manager' || user.suspended) return false;
    
    if (!user.lastLogin) return false; // Novo usuário, não suspenso
    
    const now = new Date();
    const lastLogin = new Date(user.lastLogin);
    const daysSinceLastLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastLogin >= 3;
  }

  suspendInactiveUsers(): void {
    if (!this.isManager()) return;
    
    const users = this.getAllUsers();
    const now = new Date();
    
    users.forEach(user => {
      if (user.role === 'employee' && !user.suspended && user.lastLogin) {
        const lastLogin = new Date(user.lastLogin);
        const daysSinceLastLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastLogin >= 3) {
          user.suspended = true;
          user.suspendedReason = `Suspenso por inatividade (${daysSinceLastLogin} dias sem login)`;
        }
      }
    });
    
    this.saveUsers(users);
  }

  unsuspendUser(userId: string): boolean {
    if (!this.isManager()) return false;
    
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && user.suspended) {
      user.suspended = false;
      user.suspendedReason = undefined;
      user.lastLogin = new Date(); // Reset login date
      this.saveUsers(users);
      return true;
    }
    
    return false;
  }

  getSuspendedUsers(): User[] {
    if (!this.isManager()) return [];
    
    const users = this.getAllUsers();
    return users.filter(u => u.suspended);
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
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
    if (!user) return null;
    const entries = this.getAllEntries();
    return entries.find(e => e.date === today && e.userId === user!.id) || null;
  }

  addPunch(type: PunchEntry['type'], notes?: string): PunchEntry {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Usuário não logado');
    
    const today = this.getToday();
    const entries = this.getAllEntries();
    
    let todayEntry = entries.find(e => e.date === today && e.userId === user.id);
    
    if (!todayEntry) {
      todayEntry = {
        id: this.generateId(),
        userId: user.id,
        userName: user.nickname,
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
    const user = this.getCurrentUser();
    if (!user) return;
    
    const entries = this.getAllEntries();
    const today = this.getToday();
    
    const todayEntry = entries.find(e => e.date === today && e.userId === user.id);
    if (todayEntry) {
      todayEntry.entries = todayEntry.entries.filter(e => e.id !== punchId);
      this.saveEntries(entries);
    }
  }

  getTotalHoursSummary(): { totalWorked: number; totalPause: number; daysWorked: number } {
    const user = this.getCurrentUser();
    if (!user) return { totalWorked: 0, totalPause: 0, daysWorked: 0 };
    
    const entries = this.getAllEntries().filter(e => e.userId === user.id);
    
    let totalWorked = 0;
    let totalPause = 0;
    let daysWorked = 0;

    entries.forEach(entry => {
      const summary = this.getSummaryForEntry(entry);
      if (summary.totalWorked > 0) {
        totalWorked += summary.totalWorked;
        totalPause += summary.totalPause;
        daysWorked += 1;
      }
    });

    return {
      totalWorked,
      totalPause,
      daysWorked
    };
  }

  private getSummaryForEntry(entry: TimeEntry): DailySummary {
    if (entry.entries.length === 0) {
      return {
        date: entry.date,
        totalWorked: 0,
        totalPause: 0
      };
    }

    const entries = entry.entries.map(e => ({
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

    // Não adicionar tempo atual para resumo total
    return {
      date: entry.date,
      totalWorked: Math.floor(totalWorked),
      totalPause: Math.floor(totalPause),
      firstEntry: entries[0]?.timestamp,
      lastExit: entries[entries.length - 1]?.type === 'saida' ? entries[entries.length - 1].timestamp : undefined
    };
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
