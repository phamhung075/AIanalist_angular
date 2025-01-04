import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NonAuthGuard } from './guards/non-auth.guard';
import { LayoutComponent } from './pages/layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
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
          import('./pages/layout/layout.component').then(
            (m) => m.LayoutComponent
          ),
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/profil/profil.component').then(
            (m) => m.ProfilComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
