import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TEST_View } from '@environments/environment.development';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../../services/_core/auth/auth.service';
import { TokenService } from '../../../services/_core/token/token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	constructor(
		private authService: AuthService,
		private tokenService: TokenService
	) {}

	intercept(
		req: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		console.log('Auth Interceptor - Starting interception');
		return next.handle(req).pipe(
			catchError((error: HttpErrorResponse) => {
				if (error.status === 401) {
					return this.tokenService.refreshIdToken().pipe(
						switchMap(() => next.handle(req)),
						catchError((refreshError) => {
							this.authService.logout();
							if (TEST_View.interceptor__error_detail_log) {
								return throwError(() => refreshError);
							} else {
								return throwError(
									() => new Error('Erreur de rafraîchissement du token')
								);
							}
						})
					);
				}
				if (error.status === 404) {
					console.log('Erreur 404');
					if (TEST_View.interceptor__error_detail_log) {
						return throwError(() => error);
					} else {
						return throwError(() => new Error('Ressource non trouvée'));
					}
				}
				if (TEST_View.interceptor__error_detail_log) {
					return throwError(() => error);
				} else {
					return throwError(() => new Error('Erreur inconnue'));
				}
			})
		);
	}
}
