import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeClockService } from './services/time-clock.service';
import { PunchEntry, DailySummary } from './models/time-entry.model';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  currentTime: Date = new Date();
  todayEntries: PunchEntry[] = [];
  summary: DailySummary | null = null;
  lastPunchType: PunchEntry['type'] | null = null;

  constructor(public timeClockService: TimeClockService) {}

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
    const todayEntry = this.timeClockService.getTodayEntry();
    this.todayEntries = todayEntry?.entries || [];
    this.summary = this.timeClockService.getTodaySummary();
    this.lastPunchType = this.timeClockService.getLastPunchType();
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
}
