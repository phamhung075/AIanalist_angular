import { Routes } from '@angular/router';

import { LayoutComponent } from '../ui/pages/layout/layout.component';
import { NonAuthGuard } from '@core/auth/guard/non-auth.guard';
import { AuthGuard } from '@core/auth/guard/auth.guard';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{
		path: 'tree2',
		loadComponent: () =>
			import('../ui/pages/branch-display2/branch-display2.component').then(
				(m) => m.BranchDisplay2Component
			),
		canActivate: [NonAuthGuard],
	},
	{
		path: 'tree',
		loadComponent: () =>
			import('../ui/pages/branch-display/branch-display.component').then(
				(m) => m.AppTreeContainer
			),
		canActivate: [],
	},
	{
		path: 'login',
		loadComponent: () =>
			import('../ui/pages/login/login.component').then((m) => m.LoginComponent),
		canActivate: [NonAuthGuard],
	},
	{
		path: 'dashboard',
		component: LayoutComponent,
		canActivate: [AuthGuard],
		children: [
			{
				path: '',
				loadComponent: () =>
					import('../ui/pages/layout/layout.component').then(
						(m) => m.LayoutComponent
					),
			},
			{
				path: 'profile',
				loadComponent: () =>
					import('../ui/pages/profile/profile.component').then(
						(m) => m.ProfileComponent
					),
			},
			{
				path: 'errors',
				loadComponent: () =>
					import('../ui/pages/error-test/error-test.component').then(
						(m) => m.ErrorTestComponent
					),
			},
		],
	},
	{ path: '**', redirectTo: 'login' },
];
