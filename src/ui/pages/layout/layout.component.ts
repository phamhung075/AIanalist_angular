import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../app/services/_core/auth/auth.service';
import { User } from '@angular/fire/auth';
import {
	BehaviorSubject,
	catchError,
	map,
	Observable,
	of,
	Subscription,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageService } from '../../../app/services/image/image.service';

@Component({
	selector: 'app-layout',
	imports: [RouterOutlet, RouterModule, CommonModule],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss',
})
export class LayoutComponent {
	isSidenavOpen: boolean = false;
	private subscriptions: Subscription = new Subscription();
	private profilePicture$ = new BehaviorSubject<string>('');

	constructor(
		private authService: AuthService,
		private router: Router,
		private imageService: ImageService,
		private sanitizer: DomSanitizer
	) {}
	ngOnInit() {
		// Subscribe to user changes and update profile picture
		this.subscriptions.add(
			this.authService.user$.subscribe((user: any) => {
				if (user?.picture) {
					this.profilePicture$.next(user.picture);
				}
			})
		);
	}

	ngOnDestroy() {
		this.subscriptions.unsubscribe();
	}
	toggleSidenav(): void {
		this.isSidenavOpen = !this.isSidenavOpen;
	}

	getUserName(): string {
		let userEmail = 'Anonyme';
		this.authService.user$.subscribe({
			next: (user) => {
				if (user?.email) {
					userEmail = user.email;
				}
			},
			error: () => {
				userEmail = 'Anonyme';
			},
		});
		return userEmail;
	}

	handleImageError(event: any) {
		event.target.src = 'assets/images/avatar.png';
	}

	getProfilePicture(): Observable<SafeUrl | false> {
		return this.authService.user$.pipe(
			map((user) => {
				if (!user?.photoURL) {
					return false;
				}
				return this.imageService.convertBase64ToSafeUrl(user.photoURL);
			}),
			catchError(() => of(false))
		);
	}

	hasProfilePicture(): Observable<boolean> {
		return this.profilePicture$
			.asObservable()
			.pipe(map((picture) => !!picture));
	}

	getCurrentRoute(): string {
		const currentUrl = this.router.url;
		const segments = currentUrl.split('/');
		const lastSegment = segments[segments.length - 1];
		const routeMap: { [key: string]: string } = {
			dashboard: 'Dashboard',
			profile: 'Profile',
			errors: 'Error',
		};

		return routeMap[lastSegment] || 'Dashboard';
	}

	logout(): void {
		this.authService.logout().subscribe(() => {
			this.router.navigate(['/login']);
		});
	}

	gotoDashboard(): void {
		this.router.navigate(['/dashboard']);
	}
}
