import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { TEST_View } from './../environments/environment';
import { RouteLoggingService } from './services/_core/route-logging.service';
@Component({
	selector: 'app-root',
	imports: [RouterOutlet, MatSnackBarModule, MatIconModule],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'], // Fix typo: `styleUrl` to `styleUrls`
})
export class AppComponent {
	title = 'AIanalist';
	constructor(private router: Router, private logger: RouteLoggingService) {
		if ((TEST_View as any).routes_log) {
			console.log('🚀 Routes Logging Enabled');
			this.setupRouteLogging();
		}
	}

	private setupRouteLogging() {
		this.router.events
			.pipe(filter((event) => event instanceof NavigationEnd))
			.subscribe((event: any) => {
				this.logger.logRouteHit(`Navigation to: ${event.url}`);
			});
	}
}
