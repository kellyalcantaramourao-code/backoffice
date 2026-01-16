import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TimeClockService } from './services/time-clock.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [TimeClockService]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Sistema de Ponto');
  });

  it('should update time on init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const initialTime = app.currentTime;
    app.ngOnInit();
    expect(app.currentTime).toBeInstanceOf(Date);
  });

  it('should format time correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const date = new Date('2026-01-16T10:30:45');
    const formatted = app.formatTime(date);
    expect(formatted).toBe('10:30:45');
  });

  it('should format date correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const date = new Date('2026-01-16');
    const formatted = app.formatDate(date);
    expect(formatted).toBe('16/01/2026');
  });

  it('should get punch type label', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.getPunchTypeLabel('entrada')).toBe('Entrada');
    expect(app.getPunchTypeLabel('saida')).toBe('Saída');
  });

  it('should determine if can register entry', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.lastPunchType = null;
    expect(app.canRegisterEntry).toBe(true);
    app.lastPunchType = 'saida';
    expect(app.canRegisterEntry).toBe(true);
    app.lastPunchType = 'entrada';
    expect(app.canRegisterEntry).toBe(false);
  });
});
