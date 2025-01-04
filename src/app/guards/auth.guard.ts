import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/_core/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    console.log('Guard Auth');
    console.log('Route:', this.router.url); // Debug: Afficher l'URL de la route
    console.log('Paramètres:', this.router.url.split('?')[1]); // Debug: Afficher les paramètres de la route

    return this.authService.user$.pipe(
      take(1), // S'assurer que nous prenons seulement une valeur
      map((user) => {
        console.log('Utilisateur:', user); // Debug: Afficher l'utilisateur
        if (user) {
          console.log('Accès autorisé'); // Debug: Accès autorisé
          return true;
        }
        console.log('Accès refusé, redirection vers /login'); // Debug: Accès refusé
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}
