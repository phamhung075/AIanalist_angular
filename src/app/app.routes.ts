import { FormationCommercialComponent } from './formation-commercial/formation-commercial.component';
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NonAuthGuard } from './guards/non-auth.guard';
import { LayoutComponent } from './pages/layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [NonAuthGuard]
  },
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/kyl/kyl.component').then(m => m.KylComponent)
      },
      {
        path: 'kyls',
        loadComponent: () => import('./pages/kyl/kyl.component').then(m => m.KylComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'appels',
        loadComponent: () => import('./pages/commercial/commercial.component').then(m => m.CommercialComponent)
      },
      {
        path: 'entreprises',
        loadComponent: () => import('./pages/contact-management/contact-management.component').then(m => m.ContactManagementComponent)
      },
      {
        path: 'formation',
        loadComponent: () => import('./formation-commercial/formation-commercial.component').then(m=> m.FormationCommercialComponent)},
      {
        path: 'profil',
        loadComponent: () => import('./pages/profil/profil.component').then(m => m.ProfilComponent)
      },

    ]
  },
  { path: '**', redirectTo: 'login' }
];
