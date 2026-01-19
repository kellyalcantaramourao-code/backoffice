import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { TimeClockService } from './services/time-clock.service';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(private router: Router, private timeClockService: TimeClockService) {}

  ngOnInit() {
    // Verificar se está logado
    const currentUser = this.timeClockService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
    }
  }
}
