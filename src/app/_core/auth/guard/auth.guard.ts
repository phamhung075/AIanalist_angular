import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from '../../../services/_core/auth/auth.service';
import { RouteLoggingService } from '../../../services/_core/route-logging.service';

@Injectable({
	providedIn: 'root',
})
export class AuthGuard implements CanActivate {
	constructor(
		private authService: AuthService,
		private router: Router,
		private logger: RouteLoggingService
	) {}

	canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
		const path = route.routeConfig?.path || 'unknown';
		this.logger.logGuardCheck('AuthGuard', path);

		return this.authService.getCurrentUser().pipe(
			map((user) => {
				if (user) {
					this.logger.logGuardResult('AuthGuard', true);

					if (route.routeConfig?.path === 'login') {
						this.logger.logRouteHit('Redirecting to dashboard');
						this.router.navigate(['/dashboard']);
						return false;
					}
					return true;
				}

				this.logger.logGuardResult('AuthGuard', false);
				if (route.routeConfig?.path !== 'login') {
					this.logger.logRouteHit('Redirecting to login');
					this.router.navigate(['/login']);
				}
				return route.routeConfig?.path === 'login';
			}),
			catchError((error) => {
				console.error('🔴 AuthGuard Error:', error);
				this.router.navigate(['/login']);
				return of(false);
			})
		);
	}
}
