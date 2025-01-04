import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { RestService } from '../rest-service/rest.service';
import { TokenService } from '../token-service/token.service';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private restService: RestService,
    private tokenService: TokenService,
    private router: Router,
  ) { }

  // Login
  login(email: string, password: string): Observable<any> {
    return this.restService
      .post<{ accessToken: string }>('/auth/signin', { email, password, space: 'admin' })
      .pipe(
        tap((response) => {
          this.tokenService.setAccessToken(response.accessToken); // Store access token
          this.getUserDetails().subscribe(); // Fetch user details
        })
      );
  }

  // Logout
  logout(): void {
    this.restService.delete('/auth/revoketoken', {}).subscribe({
      next: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },
    });
  }


  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.tokenService.getAccessToken();
  }

  // Get user details
  getUserDetails(): Observable<any> {
    return this.restService.get('/auth/me').pipe(
      tap((user) => this.userSubject.next(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  // Clear session
  private clearSession(): void {
    this.tokenService.clearAccessToken();
    this.userSubject.next(null);
  }

  // Get current user
  getCurrentUser(): any {
    return this.userSubject.value;
  }

  register(user: any): Observable<any> {
    return this.restService.post('/auth/signup', user);
  }

  activateAccount(userId: string): Observable<boolean> {
    return this.restService.put<boolean>(`/auth/signup/validate`, { user_id: userId });
  }

  cancelAccount(userId: string): Observable<boolean> {
    return this.restService.put<boolean>(`/auth/signup/cancel`, { user_id: userId });
  }
}
