// error-test.component.ts
import { Component, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ErrorTestService } from '../../../app/services/error-test/error-test.service';

@Component({
	selector: 'app-error-test',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div class="p-4">
			<h2 class="text-2xl font-bold mb-4">Error Testing Component</h2>

			<div class="space-y-4">
				<div>
					<button
						(click)="test404Error()"
						class="px-4 py-2 bg-blue-500 text-white rounded"
					>
						Trigger 404 Error
					</button>
				</div>

				<div>
					<button
						(click)="test500Error()"
						class="px-4 py-2 bg-red-500 text-white rounded"
					>
						Trigger 500 Error
					</button>
				</div>

				<div>
					<button
						(click)="testValidationError()"
						class="px-4 py-2 bg-yellow-500 text-white rounded"
					>
						Trigger Validation Error
					</button>
				</div>

				<div>
					<button
						(click)="testNetworkError()"
						class="px-4 py-2 bg-purple-500 text-white rounded"
					>
						Trigger Network Error
					</button>
				</div>
			</div>
		</div>
	`,
})
export class ErrorTestComponent {
	private errorTestService = inject(ErrorTestService);
	private notificationService = inject(ToastrService);

	test404Error(): void {
		this.errorTestService.testError(404).subscribe({
			error: (error) => {
				console.log('404 Error triggered:', error);
				// Directly use notification service for this specific error
				this.notificationService.warning('Resource not found');
			},
		});
	}

	test500Error(): void {
		this.errorTestService.testError(500).subscribe({
			error: (error) => {
				console.log('500 Error triggered:', error);
				this.notificationService.error('Internal server error occurred');
			},
		});
	}

	testValidationError(): void {
		this.errorTestService.testValidationError().subscribe({
			error: (error) => {
				console.log('Validation Error triggered:', error);
				this.notificationService.warning('Invalid input data');
			},
		});
	}

	testNetworkError(): void {
		this.errorTestService.testNetworkError().subscribe({
			error: (error) => {
				console.log('Network Error triggered:', error);
				this.notificationService.error('Network connection error');
			},
		});
	}
}
