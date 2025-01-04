import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class TokenService {
    private apiUrl = `${environment.urlBackend}/api`;
    private idToken: string | null = null; // Stored in memory

    constructor(private http: HttpClient) { }

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

    // Refresh the ID Token using HttpOnly cookie
    refreshIdToken(): Observable<string> {
        return this.http.get<{ idToken: string }>(
            `${this.apiUrl}/auth/refreshtoken`, 
            { withCredentials: true } // Ensure cookies are sent with the request
        ).pipe(
            tap((response: any) => {
                this.setIdToken(response.idToken); // Update the ID Token in memory
            }),
            catchError((error) => {
                this.clearIdToken();
                console.error('❌ Failed to refresh token:', error);
                return throwError(() => new Error('Failed to refresh access token'));
            }),
            map(response => response.idToken)
        );
    }
}
