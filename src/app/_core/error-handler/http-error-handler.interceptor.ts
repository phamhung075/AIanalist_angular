import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
	HttpStatusCode,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MonoTypeOperatorFunction, Observable, throwError, timer } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { AuthService } from '../../services/_core/auth/auth.service';

function retryWithDelay(count: number): MonoTypeOperatorFunction<unknown> {
	return retry({
		count,
		delay: (error, retryCount) => timer(retryCount * 1000),
	});
}

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
	private readonly MAX_RETRIES = 2;
	private readonly RETRY_STATUS_CODES = [
		HttpStatusCode.GatewayTimeout,
		HttpStatusCode.ServiceUnavailable,
		HttpStatusCode.BadGateway,
	];

	constructor(
		private notificationService: ToastrService,
		private authService: AuthService,
		private router: Router
	) {}

	intercept(
		request: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		return next.handle(request).pipe(
			retry({
				count: this.MAX_RETRIES,
				delay: (error, retryCount) => {
					if (
						error instanceof HttpErrorResponse &&
						this.RETRY_STATUS_CODES.includes(error.status)
					) {
						// Exponential backoff retry delay
						const retryDelay = Math.pow(2, retryCount) * 1000;
						return timer(retryDelay);
					}
					return throwError(() => error);
				},
			}),
			catchError((error: HttpErrorResponse) => {
				return this.handleError(error, request);
			})
		);
	}

	private handleError(
		error: HttpErrorResponse,
		request: HttpRequest<any>
	): Observable<never> {
		// Don't show errors for cancelled requests
		if (
			error instanceof HttpErrorResponse &&
			error.status === 0 &&
			error.error instanceof ProgressEvent
		) {
			// Request was cancelled
			return throwError(() => error);
		}

		let errorMessage = this.getErrorMessage(error);
		const errorResponse = {
			statusCode: error.status,
			message: errorMessage,
			url: request.url,
			timestamp: new Date().toISOString(),
			details: this.getErrorDetails(error),
		};

		// Log error for debugging
		console.error('HTTP Error:', errorResponse);

		// Handle specific status codes
		switch (error.status) {
			case HttpStatusCode.Unauthorized:
				this.handleUnauthorized();
				break;

			case HttpStatusCode.Forbidden:
				this.handleForbidden();
				break;

			case HttpStatusCode.NotFound:
				this.handleNotFound(errorMessage);
				break;

			case HttpStatusCode.BadRequest:
				this.handleBadRequest(error, errorMessage);
				break;

			case HttpStatusCode.UnprocessableEntity:
				this.handleValidationError(error);
				break;

			case 0:
				this.handleNetworkError();
				break;

			case HttpStatusCode.InternalServerError:
				this.handleServerError();
				break;

			default:
				this.handleGenericError(errorMessage);
				break;
		}

		return throwError(() => errorResponse);
	}

	private getErrorMessage(error: HttpErrorResponse): string {
		if (error.error instanceof ErrorEvent) {
			// Client-side error
			return error.error.message;
		}

		// Server-side error
		if (typeof error.error === 'string') {
			return error.error;
		}

		if (error.error?.message) {
			return error.error.message;
		}

		if (Array.isArray(error.error?.errors)) {
			return error.error.errors.map((e: any) => e.message).join('. ');
		}

		return error.message;
	}

	private getErrorDetails(error: HttpErrorResponse): any {
		if (error.error instanceof ErrorEvent) {
			return {
				errorType: 'Client Error',
				stack: error.error.error?.stack,
			};
		}

		return {
			errorType: 'Server Error',
			error: error.error,
		};
	}

	private handleUnauthorized(): void {
		this.notificationService.error('Session expired');
		this.authService.logout();
		this.router.navigate(['/login']);
	}

	private handleForbidden(): void {
		this.notificationService.error('Forbidden');
		this.router.navigate(['/dashboard']);
	}

	private handleNotFound(message: string): void {
		this.notificationService.warning(message || 'Resource not found');
	}

	private handleBadRequest(error: HttpErrorResponse, message: string): void {
		if (error.error?.errors && Array.isArray(error.error.errors)) {
			// Handle validation errors
			error.error.errors.forEach((validationError: any) => {
				this.notificationService.warning(validationError.message);
			});
		} else {
			this.notificationService.warning(message || 'Bad request');
		}
	}

	private handleValidationError(error: HttpErrorResponse): void {
		const validationErrors = error.error?.errors || [];
		validationErrors.forEach((validationError: any) => {
			this.notificationService.warning(validationError.message);
		});
	}

	private handleNetworkError(): void {
		this.notificationService.error('Network error');
	}

	private handleServerError(): void {
		this.notificationService.error('Server error');
	}

	private handleGenericError(message: string): void {
		this.notificationService.error(message || 'Generic error');
	}
}
