import { Injectable } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  firstValueFrom,
  from,
  Observable,
  throwError,
} from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { RestService } from '../rest/rest.service';
import { TokenService } from '../token/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | undefined>(undefined);
  private refreshTokenTimeout?: any;
  private isRefreshing = false;
  private initialCheckDone = false;
  readonly user$ = this.userSubject.asObservable();

  constructor(
    private restService: RestService,
    private router: Router,
    private tokenService: TokenService,
    private auth: Auth
  ) {
    this.checkAuthStatus();
    // Listen to Firebase auth state changes
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        // Get fresh tokens when auth state changes
        this.refreshUserTokens(user);
      } else {
        this.clearSession();
      }
    });
  }

  private async refreshUserTokens(user: User): Promise<void> {
    try {
      const idToken = await user.getIdToken(true);
      const userCredential = await this.auth.currentUser?.getIdTokenResult();

      if (userCredential) {
        await this.handleFirebaseUser(user, idToken);
      }
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      this.clearSession();
    }
  }

  private async handleFirebaseUser(
    firebaseUser: User,
    idToken: string
  ): Promise<void> {
    try {
      // First, set the tokens via backend
      await firstValueFrom(
        this.tokenService.setTokens({
          idToken,
          refreshToken: (firebaseUser as User).refreshToken || '',
        })
      );

      // Then proceed with session creation
      this.restService
        .post('/auth/verify', {
          idToken,
          provider: 'google',
          email: firebaseUser.email,
          uid: firebaseUser.uid,
        })
        .subscribe({
          next: (response) => {
            const authUser: User = Object.assign({}, firebaseUser);
            this.userSubject.next(authUser);
            this.startRefreshTokenTimer();
          },
          error: (error) => {
            console.error('Error setting session:', error);
            this.clearSession();
          },
        });
    } catch (error) {
      console.error('Error handling Firebase user:', error);
      this.clearSession();
    }
  }

  private verifyFirebaseToken(token: string): Observable<User> {
    return this.restService.post<User>('/auth/verify', {
      token,
    });
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      console.log('result', result);
      // Get fresh tokens after sign in
      const idToken = await result.user.getIdToken(true);
      const refreshToken = (result as any)._tokenResponse?.refreshToken || '';
      console.log('idToken', idToken);
      console.log('refreshToken', refreshToken);
      await this.handleFirebaseUser(result.user, idToken);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  private checkAuthStatus(): void {
    if (this.initialCheckDone || this.isRefreshing || this.userSubject.value) {
      return;
    }

    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.refreshUserTokens(currentUser);
    } else {
      this.clearSession();
      this.router.navigate(['/login']);
    }
    this.initialCheckDone = true;
  }

  getCurrentUser(): Observable<User> {
    if (this.userSubject.value) {
      return new Observable((subscriber) => {
        subscriber.next(this.userSubject.value);
        subscriber.complete();
      });
    }

    return this.restService.get<User>('/auth/current').pipe(
      tap((user) => {
        if (!this.userSubject.value) {
          this.userSubject.next(user as User);
        }
      }),
      catchError((error) => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.restService.post<any>('/auth/login', { email, password }).pipe(
      switchMap((response) => {
        if (response && response.success) {
          return this.getCurrentUser().pipe(
            tap(() => {
              this.startRefreshTokenTimer();
              this.router.navigate(['/dashboard']);
            }),
            map(() => response)
          );
        }
        return throwError(() => new Error('Login failed'));
      }),
      catchError((error) => {
        console.error('Login error:', error);
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<void> {
    return new Observable((subscriber) => {
      Promise.all([
        this.auth.signOut(),
        firstValueFrom(this.restService.post<void>('/auth/logout', {})),
      ])
        .then(() => {
          this.clearSession();
          this.router.navigate(['/login']);
          subscriber.complete();
        })
        .catch((error) => {
          console.error('Erreur de déconnexion :', error);
          this.clearSession();
          this.router.navigate(['/login']);
          subscriber.error(error);
        });
    });
  }

  private clearSession(): void {
    this.stopRefreshTokenTimer();
    this.userSubject.next(undefined);
    this.initialCheckDone = false;
    this.isRefreshing = false;
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  private startRefreshTokenTimer(): void {
    const refreshInterval = 14 * 60 * 1000;
    this.stopRefreshTokenTimer();
    this.refreshTokenTimeout = setInterval(() => {
      this.refreshToken().subscribe();
    }, refreshInterval);
  }

  refreshToken(): Observable<void> {
    if (this.isRefreshing) {
      return throwError(() => new Error('Token refresh in progress'));
    }

    this.isRefreshing = true;
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      this.clearSession();
      return throwError(() => new Error('No authenticated user'));
    }

    return from(currentUser.getIdToken(true)).pipe(
      switchMap((token: string) => {
        return from(this.refreshUserTokens(currentUser));
      }),
      catchError((error) => {
        this.clearSession();
        return throwError(() => error);
      }),
      finalize(() => {
        this.isRefreshing = false;
      }),
      map(() => void 0)
    );
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearInterval(this.refreshTokenTimeout);
    }
  }

  ngOnDestroy(): void {
    this.stopRefreshTokenTimer();
    this.userSubject.complete();
  }
}
