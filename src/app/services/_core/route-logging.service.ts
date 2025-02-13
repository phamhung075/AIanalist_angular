import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class RouteLoggingService {
	logRouteHit(route: string) {
		console.log(`🛣️ Route Hit: ${route}`);
	}

	logGuardCheck(guardName: string, path: string) {
		console.log(`🛡️ ${guardName} Check - Path: ${path}`);
	}

	logGuardResult(guardName: string, result: boolean) {
		console.log(
			`🔒 ${guardName} Result: ${result ? '✅ Allowed' : '❌ Blocked'}`
		);
	}
}
