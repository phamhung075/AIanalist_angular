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
    private idToken: string | null = null;

    constructor(private http: HttpClient) { }

    // Get the access token
    getIdToken(): string | null {
        return this.idToken;
    }

    // Set the access token
    setIdToken(token: string): void {
        this.idToken = token;
    }

    // Clear the access token
    clearIdToken(): void {
        this.idToken = null;
    }

    // Refresh the access token using the refresh token (HttpOnly cookies)
    refreshIdToken(): Observable<string> {
        return this.http.post<{ idToken: string }>(
            `${this.apiUrl}/auth/refreshtoken`, 
            {},
            { withCredentials: true } // Ensures cookies are sent
        ).pipe(
            tap((response) => {
                this.setIdToken(response.idToken); // Save the new access token
            }),
            catchError((error) => {
                this.clearIdToken();
                return throwError(() => new Error('Failed to refresh access token'));
            }),
            map(response => response.idToken)
        );
    }
    
}
