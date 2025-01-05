import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, finalize, switchMap } from 'rxjs/operators';
import { RestService } from '../rest-service/rest.service';

export interface User {
  id: string;
  email: string;
  roles?: string[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  metadata: {
    responseTime: string;
    timestamp: string;
    code: number;
    status: string;
  };
  options?: {
    headers: {
      'Set-Cookie'?: string[];
      [key: string]: any;
    };
  };
  links: {
    [key: string]: {
      rel: string;
      href: string;
      method: string;
      title?: string;
    };
  };
}

export interface ApiErrorResponse {
  success: false;
  code: number;
  message: string;
  metadata: {
    timestamp: string;
    statusCode: string;
    description: string;
    documentation: string;
    responseTime: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

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
    private router: Router,
  ) {
    this.restoreSession();
  }

  private restoreSession(): void {
    this.getUserDetails().subscribe({
      error: (error) => {
        if (error.code === 401) {
          this.clearSession();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  getUserDetails(): Observable<ApiResponse<User>> {
    return this.restService.get<ApiResponse<User>>('/auth/current').pipe(
      tap((response) => {
        if (response.success) {
          this.userSubject.next(response.data);
        } else {
          // If the response indicates failure, handle accordingly
          if (response.code === 401) {
            this.clearSession();
            this.router.navigate(['/login']);
          }
        }
      }),
      catchError((error) => {
        // Handle network or other errors
        this.clearSession();
        if (error.code === 401) {
          this.router.navigate(['/login']);
        }
        return throwError(() => ({
          code: error.code || 500,
          message: error.message || 'Failed to fetch user details'
        }));
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.restService
      .post('/auth/login', { 
        email, 
        password, 
        space: 'user'
      })
      .pipe(
        tap(response => {
          console.log('Login successful');
          // Immediately try to get user details to verify cookie authentication
          this.verifyAuth();
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  private verifyAuth() {
    this.restService.get('/auth/current')
      .subscribe({
        next: (response) => {
          console.log('Auth verification successful:', response);
        },
        error: (error) => {
          console.error('Auth verification failed:', error);
        }
      });
  }

  checkAuthStatus(): Observable<any> {
    return this.restService.get('/auth/current').pipe(
      tap(response => {
        console.log('Auth status check response:', response);
      }),
      catchError(error => {
        console.error('Auth status check error:', error);
        return throwError(() => error);
      })
    );
  }

  private clearSession(): void {
    this.userSubject.next(null);
    this.stopRefreshTokenTimer();
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  private startRefreshTokenTimer(): void {
    // Refresh token 1 minute before expiry (assuming 1-hour expiry from the token)
    const REFRESH_INTERVAL = 59 * 60 * 1000; // 59 minutes
    
    this.stopRefreshTokenTimer(); // Clear any existing timer
    
    this.refreshTokenTimeout = setInterval(() => {
      this.refreshToken().subscribe({
        error: (error) => {
          if (error.code === 401) {
            this.clearSession();
            this.router.navigate(['/login']);
          }
        }
      });
    }, REFRESH_INTERVAL);
  }

  refreshToken(): Observable<ApiResponse<{}>> {
    if (this.isRefreshing) {
      return throwError(() => ({
        code: 429,
        message: 'Token refresh already in progress'
      }));
    }

    this.isRefreshing = true;

    return this.restService.get<ApiResponse<{}>>('/auth/refreshtoken').pipe(
      tap((response) => {
        if (response.success) {
          this.startRefreshTokenTimer();
        }
      }),
      catchError((error) => {
        this.clearSession();
        return throwError(() => ({
          code: error.code || 500,
          message: error.message || 'Token refresh failed'
        }));
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearInterval(this.refreshTokenTimeout);
    }
  }

  async logout() {
    try {
      // Call the server to revoke token
      await this.restService.delete('/auth/revoketoken').toPromise();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with client-side logout even if server call fails
    } finally {
      // Clear user state
      this.userSubject.next(null);
      
      // Stop refresh timer
      this.stopRefreshTokenTimer();
      
      // Navigate to login page
      await this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    this.stopRefreshTokenTimer();
    this.userSubject.complete();
    this.clearSession();
  }
}