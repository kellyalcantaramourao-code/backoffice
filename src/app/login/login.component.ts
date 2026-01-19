import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TimeClockService } from '../services/time-clock.service';
import { User } from '../models/time-entry.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isLoginMode = true;
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoading = false;
  loginError = '';

  constructor(private fb: FormBuilder, private router: Router, private timeClockService: TimeClockService) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      servidor: ['', [Validators.required]],
      nickname: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const senha = group.get('senha');
    const confirmarSenha = group.get('confirmarSenha');
    return senha && confirmarSenha && senha.value === confirmarSenha.value ? null : { mismatch: true };
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';
      
      const { username, password } = this.loginForm.value;
      
      try {
        const user = this.timeClockService.login(username, password);
        
        setTimeout(() => {
          this.isLoading = false;
          if (user) {
            this.timeClockService.setCurrentUser(user);
            localStorage.setItem('isLoggedIn', 'true');
            this.router.navigate(['/']);
          } else {
            this.loginError = 'Usuário ou senha incorretos. Use seu nickname ou email cadastrado.';
          }
        }, 1000);
      } catch (error) {
        this.isLoading = false;
        this.loginError = (error as Error).message;
      }
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      const { nome, servidor, nickname, email, senha } = this.registerForm.value;
      
      try {
        this.timeClockService.registerUser({ nome, servidor, nickname, email, senha });
        
        setTimeout(() => {
          this.isLoading = false;
          alert('Cadastro realizado com sucesso! Agora faça o login com seu nickname ou email.');
          this.isLoginMode = true;
          this.registerForm.reset();
        }, 1000);
      } catch (error) {
        this.isLoading = false;
        alert(error instanceof Error ? error.message : 'Erro desconhecido no cadastro');
      }
    }
  }
}
