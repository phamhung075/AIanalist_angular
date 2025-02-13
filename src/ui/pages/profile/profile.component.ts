import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Profile } from '../../../app/services/profile-service/profile.interface';
import { ProfileService } from '../../../app/services/profile-service/profile.service';
import { AuthService } from '../../../app/services/_core/auth/auth.service';

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	imports: [CommonModule, FormsModule],
	standalone: true,
})
export class ProfileComponent implements OnInit, OnDestroy {
	profile: Profile = {
		email: '',
		firstname: '',
		lastname: '',
		company_name: '',
		address: '',
		siret: '',
		notification: false,
		phone: '',
		authProvider: '',
		linkedAccounts: [],
	};

	backupProfile: Profile;
	showPasswordFields = false;
	newPassword = '';
	lastPassword = '';
	confirmPassword = '';
	isGoogleLinked = false;
	private destroy$ = new Subject<void>();
	loading = false;
	error: string | null = null;
	successMessage: string | null = null;
	constructor(
		private profileService: ProfileService,
		private authService: AuthService
	) {
		this.backupProfile = { ...this.profile };
	}

	ngOnInit(): void {
		this.profileService
			.getProfile()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (profile) => {
					this.profile = profile;
					this.backupProfile = { ...profile };
					this.isGoogleLinked =
						(profile.linkedAccounts && profile.linkedAccounts.length > 1) ||
						false;
				},
				error: (error) => {
					console.error('Error loading profile:', error);
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
			await this.profileService.linkWithGoogle();
			this.isGoogleLinked = true;
			this.successMessage = 'Compte Google lié avec succès';
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
			await this.profileService.unlinkProvider('google.com');
			this.isGoogleLinked = false;
			this.successMessage = 'Compte Google délié avec succès';
			setTimeout(() => (this.successMessage = null), 3000);
		} catch (error) {
			console.error('Error unlinking Google account:', error);
			this.error = 'Erreur lors de la déliaison du compte Google';
		} finally {
			this.loading = false;
		}
	}

	switchNotificationState(): void {
		this.profileService.switchNotificationState().subscribe({
			next: (state) => {
				this.profile.notification = state;
				this.backupProfile.notification = state;
			},
			error: (error) => {
				this.profile.notification = !this.profile.notification;
				console.error('Error switching notification state:', error);
				// Show error message
			},
		});
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
}
