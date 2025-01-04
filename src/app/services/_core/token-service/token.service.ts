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
    private accessToken: string | null = null;

    constructor(private http: HttpClient) { }

    // Get the access token
    getAccessToken(): string | null {
        return this.accessToken;
    }

    // Set the access token
    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    // Clear the access token
    clearAccessToken(): void {
        this.accessToken = null;
    }

    // Refresh the access token using the refresh token (HttpOnly cookies)
    refreshAccessToken(): Observable<string> {
        return this.http.post<{ accessToken: string }>(
            `${this.apiUrl}/auth/refreshtoken`, 
            {},
            { withCredentials: true } // Ensures cookies are sent
        ).pipe(
            tap((response) => {
                this.setAccessToken(response.accessToken); // Save the new access token
            }),
            catchError((error) => {
                this.clearAccessToken();
                return throwError(() => new Error('Failed to refresh access token'));
            }),
            map(response => response.accessToken)
        );
    }
    
}
