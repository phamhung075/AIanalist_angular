import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

import { catchError, map, switchMap } from 'rxjs/operators';
import { TokenService } from '../services/_core/token-service/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    // Check if the access token exists
    const accessToken = this.tokenService.getIdToken();

    if (accessToken) {
      // If accessToken exists, allow navigation
      return of(true);
    }

    // If no accessToken, try refreshing the token
    return this.tokenService.refreshIdToken().pipe(
      map(() => {
        // If refresh is successful, allow navigation
        return true;
      }),
      catchError(() => {
        // If refresh fails, redirect to login
        return of(this.router.createUrlTree(['/login']));
      })
    );
  }
}
