import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  constructor(private fb: FormBuilder, private router: Router) {
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
      // Simulação de login
      setTimeout(() => {
        this.isLoading = false;
        localStorage.setItem('isLoggedIn', 'true');
        this.router.navigate(['/']);
      }, 1000);
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      // Simulação de cadastro
      setTimeout(() => {
        this.isLoading = false;
        alert('Cadastro realizado com sucesso! Faça o login.');
        this.isLoginMode = true;
        this.registerForm.reset();
      }, 1000);
    }
  }
}
