import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { async, Subject } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { Profile } from '../../../app/services/profile-service/profile.interface';
import { ProfileService } from '../../../app/services/profile-service/profile.service';
import { AuthService } from '../../../app/services/_core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	imports: [CommonModule, FormsModule],
	standalone: true,
})
export class ProfileComponent implements OnInit, OnDestroy {
	profile: Profile = {
		email: '',
		name: '',
		email_verified: false,
		phone_number: '',
		picture: '',
	};
	notificationsEnabled = signal<boolean>(false);

	backupProfile: Profile;
	showPasswordFields = false;
	newPassword = '';
	lastPassword = '';
	confirmPassword = '';
	isGoogleLinked = signal<boolean>(false);
	isGoogleProvider = signal<boolean>(false);
	private destroy$ = new Subject<void>();
	loading = false;
	error: string | null = null;
	successMessage: string | null = null;
	constructor(
		private profileService: ProfileService,
		private authService: AuthService,
		private toastrService: ToastrService
	) {
		this.backupProfile = { ...this.profile };
	}

	ngOnInit(): void {
		this.authService
			.getCurrentUser()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (currentUser: any) => {
					console.log('currentUser', currentUser);
					if (currentUser.uid) {
						const aud = currentUser.aud;
						const user_email = currentUser.email;
						const email_verified = currentUser.email_verified ?? false;
						const name = currentUser.name;
						const picture = currentUser.picture ?? '';
						const phone_number = currentUser.phone_number ?? '';
						const currentUser_firebase = currentUser.firebase;
						const signByGoogle =
							currentUser_firebase.sign_in_provider === 'google.com';

						// console.log('user_email', user_email);
						// console.log('email_verified', email_verified);
						// console.log('name', name);
						// console.log('picture', picture);
						// console.log('signInProvider', signByGoogle);
						this.profile = {
							email: user_email,
							name: name,
							email_verified: email_verified,
							phone_number: phone_number,
							picture: picture,
						};

						this.isGoogleLinked.set(signByGoogle);
						this.isGoogleProvider.set(signByGoogle);
						// Utiliser les données de l'utilisateur...
					}
				},
				error: (error: any) => {
					console.error(
						"Erreur lors de la récupération de l'utilisateur:",
						error
					);
				},
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	updateProfile(): void {
		this.loading = true;
		this.error = null;
		this.successMessage = null;

		this.profileService.updateProfile(this.profile).subscribe({
			next: (profile) => {
				this.loading = false;
				this.backupProfile = { ...profile };
				this.successMessage = 'Profil mis à jour avec succès';
				setTimeout(() => (this.successMessage = null), 3000);
			},
			error: (err) => {
				this.loading = false;
				this.profile = { ...this.backupProfile };
				console.error('Erreur lors de la mise à jour du profil:', err);
				this.error =
					'Erreur lors de la mise à jour du profil. Veuillez réessayer.';
			},
		});
	}

	async linkGoogleAccount(): Promise<void> {
		try {
			this.loading = true;
			this.error = null;
			const result = await this.profileService.linkWithGoogle();
			if (result) {
				this.isGoogleLinked.set(true);
				this.successMessage = 'Compte Google lié avec succès';
				setTimeout(() => (this.successMessage = null), 3000);
			} else {
				this.error = 'Erreur lors de la liaison du compte Google';
			}

			setTimeout(() => (this.successMessage = null), 3000);
		} catch (error) {
			console.error('Error linking Google account:', error);
			this.error = 'Erreur lors de la liaison du compte Google';
		} finally {
			this.loading = false;
		}
	}

	async unlinkGoogleAccount(): Promise<void> {
		try {
			this.loading = true;
			this.error = null;
			const result = await this.profileService.unlinkProvider('google.com');
			if (result) {
				this.isGoogleLinked.set(false);
				this.successMessage = 'Compte Google délié avec succès';
				setTimeout(() => (this.successMessage = null), 3000);
			} else {
				this.error = 'Erreur lors de la déliaison du compte Google';
			}
		} catch (error) {
			console.error('Error unlinking Google account:', error);
			this.error = 'Erreur lors de la déliaison du compte Google';
		} finally {
			this.loading = false;
		}
	}

	switchNotificationState(): void {
		this.notificationsEnabled.set(!this.notificationsEnabled());
		this.toastrService.success(
			'Notifications ' +
				(this.notificationsEnabled() ? 'activées' : 'désactivées'),
			'NOTIFICATION'
		);
		// this.profileService.switchNotificationState().subscribe({
		// 	next: (state) => {
		// 		this.profile.notification = state;
		// 		this.backupProfile.notification = state;
		// 	},
		// 	error: (error) => {
		// 		this.profile.notification = !this.profile.notification;
		// 		console.error('Erreur lors du changement d\'état de notification:', error);
		// 		// Afficher le message d'erreur
		// 	},
		// });
	}

	changePassword(): void {
		if (!this.validatePasswords()) return;

		this.profileService
			.updatePassword(this.lastPassword, this.newPassword)
			.subscribe({
				next: () => {
					this.resetPasswordFields();
					// Afficher le message de succès
				},
				error: (error: any) => {
					console.error('Erreur lors du changement de mot de passe:', error);
					// Afficher le message d'erreur
				},
			});
	}

	validatePasswords(): boolean {
		return !!(
			this.newPassword &&
			this.confirmPassword &&
			this.lastPassword &&
			this.newPassword === this.confirmPassword
		);
	}

	private resetPasswordFields(): void {
		this.showPasswordFields = false;
		this.newPassword = '';
		this.confirmPassword = '';
		this.lastPassword = '';
	}

	shouldShowPasswordSection(): boolean {
		// Hide password section if logged in with Google
		return !this.isGoogleProvider();
	}

	shouldShowLinkSection(): boolean {
		// Hide link section if already using Google as main provider
		return !this.isGoogleProvider();
	}
}
