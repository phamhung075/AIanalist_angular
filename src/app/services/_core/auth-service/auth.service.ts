import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, switchMap, tap, finalize, map } from 'rxjs/operators';
import { RestService } from '../rest-service/rest.service';
import { TokenService } from '../token-service/token.service';

export interface User {
  id: string;
  email: string;
  roles?: string[];
  // Add other user properties as needed
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private refreshTokenTimeout?: any;
  private isRefreshing = false;

  readonly user$ = this.userSubject.asObservable();

  constructor(
    private restService: RestService,
    private tokenService: TokenService,
    private router: Router,
  ) {
    // Try to restore user session on service initialization
    this.restoreSession();
  }

  private restoreSession(): void {
    if (this.tokenService.getAccessToken()) {
      this.getUserDetails().subscribe();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.restService
      .post<AuthResponse>('/auth/login', { 
        email, 
        password, 
        space: 'user'
      })
      .pipe(
        tap((response : any) => {
          this.tokenService.setAccessToken(response.accessToken);
          if (response.user) {
            this.userSubject.next(response.user);
          }
          this.startRefreshTokenTimer();
        }),
        switchMap((response) => 
          response.user ? of(response) : this.getUserDetails().pipe(
            map(user => ({ ...response, user }))
          )
        ),
        catchError((error) => {
          this.clearSession();
          return throwError(() => new Error(error.message || 'Login failed'));
        })
      );
  }
  //
  logout(): Observable<void> {
    return this.restService.delete<void>('/auth/revoketoken', {}).pipe(
      tap(() => {
        this.clearSession();
        this.stopRefreshTokenTimer();
        this.router.navigate(['/login']);
      })
    );
  }

  isAuthenticated(): boolean {
    const token = this.tokenService.getAccessToken();
    if (!token) return false;
    
    // Optional: Add token expiration check
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      return tokenData.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getUserDetails(): Observable<User> {
    return this.restService.get<User>('/auth/current').pipe(
      tap((user) => {
        this.userSubject.next(user);
      }),
      catchError((error) => {
        this.clearSession();
        return throwError(() => new Error('Failed to fetch user details'));
      })
    );
  }

  private clearSession(): void {
    this.tokenService.clearAccessToken();
    this.userSubject.next(null);
    this.stopRefreshTokenTimer();
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  private startRefreshTokenTimer(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) return;

    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expires = new Date(tokenData.exp * 1000);
      const timeout = expires.getTime() - Date.now() - (60 * 1000); // Refresh 1 minute before expiry

      this.refreshTokenTimeout = setTimeout(() => {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          this.tokenService.refreshAccessToken().pipe(
            finalize(() => this.isRefreshing = false)
          ).subscribe({
            next: () => this.startRefreshTokenTimer(),
            error: () => this.logout()
          });
        }
      }, Math.max(0, timeout));
    } catch {
      console.error('Invalid token format');
    }
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  register(user: Partial<User>): Observable<User> {
    return this.restService.post<User>('/auth/signup', user).pipe(
      catchError((error) => 
        throwError(() => new Error(error.message || 'Registration failed'))
      )
    );
  }

  activateAccount(userId: string): Observable<boolean> {
    return this.restService.put<boolean>('/auth/signup/validate', { 
      user_id: userId 
    }).pipe(
      catchError((error) => 
        throwError(() => new Error(error.message || 'Account activation failed'))
      )
    );
  }

  cancelAccount(userId: string): Observable<boolean> {
    return this.restService.put<boolean>('/auth/signup/cancel', { 
      user_id: userId 
    }).pipe(
      catchError((error) => 
        throwError(() => new Error(error.message || 'Account cancellation failed'))
      )
    );
  }
}