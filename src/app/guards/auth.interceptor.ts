import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { TokenService } from '../services/_core/token-service/token.service';
import { AuthService } from '../services/_core/auth-service/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private tokenService: TokenService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const accessToken = this.tokenService.getAccessToken();

    // If there's an access token, attach it to the request headers
    if (accessToken) {
      const clonedRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
      });
      return next.handle(clonedRequest).pipe(
        catchError((error) => {
          // If the token is expired (401 error), refresh the token and retry the request
          if (error.status === 401) {
            return this.handle401Error(req, next);
          }
          return throwError(() => error);
        })
      );
    }

    // If no token, proceed with the request as is
    return next.handle(req);
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.tokenService.refreshAccessToken().pipe(
      switchMap(() => {
        // Retry the request with the new access token
        const newAccessToken = this.tokenService.getAccessToken();
        if (newAccessToken) {
          const clonedRequest = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${newAccessToken}`),
          });
          return next.handle(clonedRequest);
        }
        return next.handle(req);
      }),
      catchError((error) => {
        // If refresh token fails, logout the user
        this.authService.logout();
        return throwError(() => error);
      })
    );
  }
}