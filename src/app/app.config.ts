import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpErrorInterceptor } from '@core/error-handler/http-error-handler.interceptor';
import { provideToastr, ToastrIconClasses } from 'ngx-toastr';
import { firebaseConfig } from '../environments/firebaseConfig';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes, withComponentInputBinding()),
		provideAnimations(),
		provideAnimationsAsync(),
		provideHttpClient(),
		provideFirebaseApp(() => initializeApp(firebaseConfig)),
		provideAuth(() => getAuth()),
		provideFirestore(() => getFirestore()), // Add Firestore provider
		// {
		// 	provide: ErrorHandler,
		// 	useClass: AppErrorHandler,
		// },
		{
			provide: HTTP_INTERCEPTORS,
			useClass: HttpErrorInterceptor,
			multi: true,
		},
		provideToastr({
			/**
			 * max toasts opened. Toasts will be queued
			 * Zero is unlimited
			 * default: 0
			 */
			maxOpened: 3,
			/**
			 * dismiss current toast when max is reached
			 * default: false
			 */
			autoDismiss: true,
			// iconClasses: Partial<ToastrIconClasses>;
			/**
			 * block duplicate messages
			 * default: false
			 */
			preventDuplicates: false,
			/**
			 * display the number of duplicate messages
			 * default: false
			 */
			countDuplicates: false,
			/**
			 * Reset toast timeout when there's a duplicate (preventDuplicates needs to be set to true)
			 * default: false
			 */
			resetTimeoutOnDuplicate: false,
			/**
			 * consider the title of a toast when checking if duplicate
			 * default: false
			 */
			includeTitleDuplicates: false,
		}),
	],
};
