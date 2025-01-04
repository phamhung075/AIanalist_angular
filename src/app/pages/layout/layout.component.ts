import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/_core/auth-service/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  isSidenavOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || 'Anonyme';
  }

  getCurrentRoute(): string {
    const currentUrl = this.router.url;
    const segments = currentUrl.split('/');
    const lastSegment = segments[segments.length - 1];
    // console.log(lastSegment);
    const routeMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'profil': 'Profil',
      'formations': 'Formations',
      'kyls': 'KYLs',
      'credits': 'Crédits',
      'demo': 'Démo',
    };

    return routeMap[lastSegment] || 'Dashboard';
  }

  logout(): void {
    this.authService.logout();
  }
}
