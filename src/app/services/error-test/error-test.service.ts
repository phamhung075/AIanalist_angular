// error-test.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ErrorTestService {
	private apiUrl = environment.urlBackend;

	constructor(private http: HttpClient) {}

	testError(statusCode: number) {
		return this.http.get(`${this.apiUrl}/test-error/${statusCode}`);
	}

	testValidationError() {
		return this.http.post(`${this.apiUrl}/test-error/validation`, {
			email: 'invalid',
			password: '123',
		});
	}

	testNetworkError() {
		// This will cause a network error
		return this.http.get('https://non-existent-domain.example');
	}
}
