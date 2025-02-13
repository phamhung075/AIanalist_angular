import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, map } from 'rxjs';
import { AuthService } from '../../../app/services/_core/auth/auth.service';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [CommonModule, RouterModule, ReactiveFormsModule],
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
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

	ngOnInit(): void {
		this.authService.getCurrentUser().subscribe((result) => {
			console.log('LoginComponent - getCurrentUser:', result);
			if (result.email && result.data.uid) {
				console.log('Utilisateur trouvé - redirection vers le tableau de bord');
				this.router.navigate(['/dashboard']);
			}
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
							console.log('Login success');
							console.log('redirecting to dashboard');
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
