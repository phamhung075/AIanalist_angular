import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, tap, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { RestService } from '../rest/rest.service';

@Injectable({
	providedIn: 'root',
})
export class TokenService {
	private idToken: string | null = null; // Stored in memory

	constructor(private restService: RestService) {}

	// Get the ID Token
	getIdToken(): string | null {
		return this.idToken;
	}

	// Set the ID Token
	setIdToken(token: string): void {
		this.idToken = token;
	}

	// Clear the ID Token
	clearIdToken(): void {
		this.idToken = null;
	}

	clearIdTokenOnCookie(): void {
		console.log('clearIdTokenOnCookie');
		const cookieName = 'idToken';
		document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
	}

	clearRefreshTokenOnCookie(): void {
		console.log('clearRefreshTokenOnCookie');
		const cookieName = 'refreshToken';
		document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
	}

	// Refresh the ID Token using HttpOnly cookie
	refreshIdToken(): Observable<string> {
		return this.restService.get<{ idToken: string }>(`/auth/refreshtoken`).pipe(
			retry(1), // Add retry for network issues
			timeout(5000), // Add timeout
			tap((response: any) => {
				this.setIdToken(response.idToken);
			}),
			catchError((error) => {
				this.clearIdToken();
				return throwError(() => error);
			})
		);
	}

	setTokens(tokens: { idToken: string; refreshToken: string }) {
		// The actual token storage will be handled by your backend
		return this.restService.post(`/auth/set-tokens`, tokens);
	}
}
