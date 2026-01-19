import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeClockService } from '../services/time-clock.service';
import { PunchEntry, DailySummary, User } from '../models/time-entry.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentTime: Date = new Date();
  todayEntries: PunchEntry[] = [];
  summary: DailySummary | null = null;
  totalSummary: { totalWorked: number; totalPause: number; daysWorked: number } | null = null;
  lastPunchType: PunchEntry['type'] | null = null;
  isManager = false;
  employeesReport: { 
    user: User; 
    today: { totalWorked: number; totalPause: number; daysWorked: number };
    thisMonth: { totalWorked: number; totalPause: number; daysWorked: number };
    thisYear: { totalWorked: number; totalPause: number; daysWorked: number };
  }[] = [];
  suspendedUsers: User[] = [];

  constructor(public timeClockService: TimeClockService, private router: Router) {}

  ngOnInit() {
    this.updateTime();
    this.loadTodayData();

    // Atualiza o relógio a cada segundo
    setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  updateTime() {
    this.currentTime = new Date();
  }

  loadTodayData() {
    const user = this.timeClockService.getCurrentUser();
    this.isManager = this.timeClockService.isManager();
    
    if (this.isManager) {
      this.employeesReport = this.timeClockService.getAllEmployeesReport();
      this.suspendedUsers = this.timeClockService.getSuspendedUsers();
      // Verificar usuários inativos a cada carregamento
      this.timeClockService.suspendInactiveUsers();
    } else {
      const todayEntry = this.timeClockService.getTodayEntry();
      this.todayEntries = todayEntry?.entries || [];
      this.summary = this.timeClockService.getTodaySummary();
      this.totalSummary = this.timeClockService.getTotalHoursSummary();
      this.lastPunchType = this.timeClockService.getLastPunchType();
    }
  }

  registerEntry() {
    this.timeClockService.addPunch('entrada');
    this.loadTodayData();
  }

  registerExit() {
    this.timeClockService.addPunch('saida');
    this.loadTodayData();
  }

  registerPauseStart() {
    this.timeClockService.addPunch('pausa-inicio');
    this.loadTodayData();
  }

  registerPauseEnd() {
    this.timeClockService.addPunch('pausa-fim');
    this.loadTodayData();
  }

  deletePunch(punchId: string) {
    if (confirm('Deseja realmente excluir este registro?')) {
      this.timeClockService.deletePunch(punchId);
      this.loadTodayData();
    }
  }

  getPunchTypeLabel(type: PunchEntry['type']): string {
    const labels = {
      'entrada': 'Entrada',
      'saida': 'Saída',
      'pausa-inicio': 'Início Pausa',
      'pausa-fim': 'Fim Pausa'
    };
    return labels[type];
  }

  getPunchTypeClass(type: PunchEntry['type']): string {
    return type;
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  get canRegisterEntry(): boolean {
    return !this.lastPunchType || this.lastPunchType === 'saida';
  }

  get canRegisterExit(): boolean {
    return this.lastPunchType === 'entrada' || this.lastPunchType === 'pausa-fim';
  }

  get canRegisterPauseStart(): boolean {
    return this.lastPunchType === 'entrada' || this.lastPunchType === 'pausa-fim';
  }

  get canRegisterPauseEnd(): boolean {
    return this.lastPunchType === 'pausa-inicio';
  }

  logout() {
    this.timeClockService.logout();
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }

  unsuspendUser(userId: string) {
    if (confirm('Deseja liberar o acesso deste usuário?')) {
      const success = this.timeClockService.unsuspendUser(userId);
      if (success) {
        alert('Usuário liberado com sucesso!');
        this.loadTodayData(); // Recarregar dados
      } else {
        alert('Erro ao liberar usuário.');
      }
    }
  }
}
