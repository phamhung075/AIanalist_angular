import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/_core/auth/auth.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  isSidenavOpen: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  getUserName(): string {
    let userEmail = 'Anonyme';
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user?.email) {
          userEmail = user.email;
        }
      },
      error: () => {
        userEmail = 'Anonyme';
      },
    });
    return userEmail;
  }

  getCurrentRoute(): string {
    const currentUrl = this.router.url;
    const segments = currentUrl.split('/');
    const lastSegment = segments[segments.length - 1];
    const routeMap: { [key: string]: string } = {
      dashboard: 'Dashboard',
      profil: 'Profil',
      formations: 'Formations',
      kyls: 'KYLs',
      credits: 'Crédits',
      demo: 'Démo',
    };

    return routeMap[lastSegment] || 'Dashboard';
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
