import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
	private notificationService: ToastrService = inject(ToastrService);

	constructor(private zone: NgZone) {}

	handleError(error: unknown): void {
		console.error('Caught by Custom Error Handler: ', error);

		if (!(error instanceof HttpErrorResponse)) {
			this.zone.run(() => {
				this.notificationService.error((error as any).message);
			});
		}
	}
}
