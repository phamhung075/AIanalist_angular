import { Component, NgZone } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/_core/auth/auth.service';
import { GoogleAuthService } from '../../services/auth/google.service';
import { finalize, take } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.error = null;

      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      this.authService
        .login(email, password)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.router.navigate(['/dashboard']);
            });
          },
          error: (err) => {
            this.error =
              err.error?.message || 'Login failed. Please try again.';
          },
        });
    }
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      await this.authService.signInWithGoogle();
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error = 'Google sign-in failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
