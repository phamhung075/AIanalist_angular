import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { IContact } from '../../interface/contact.interface';
import { AuthService } from '../_core/auth/auth.service';
import { RestService } from '../_core/rest/rest.service';
import { Profile } from './profile.interface';
import { User } from '@angular/fire/auth';

@Injectable({
	providedIn: 'root',
})
export class ProfileService {
	private restService: RestService = inject(RestService);
	private authService: AuthService = inject(AuthService);
	private firestore: Firestore = inject(Firestore);
	private readonly destroy$ = new Subject<void>();
	private apiUrl = 'your-backend-url/api';

	constructor(private http: HttpClient) {
		inject(DestroyRef).onDestroy(() => {
			this.destroy$.next();
			this.destroy$.complete();
		});
	}

	// Move sensitive operations to backend
	updateProfile(profile: Partial<Profile>): Observable<Profile> {
		return this.restService.put<Profile>(`/profile`, profile);
	}

	updatePassword(
		currentPassword: string,
		newPassword: string
	): Observable<void> {
		return this.restService.post<void>(`/profile/password`, {
			currentPassword,
			newPassword,
		});
	}

	linkWithGoogle(): Observable<boolean> {
		return of(true);
	}

	unlinkProvider(providerId: string): Observable<boolean> {
		return of(true);
	}

	switchNotificationState(): Observable<boolean> {
		return of(true);
	}
}
