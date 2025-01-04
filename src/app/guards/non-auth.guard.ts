import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/_core/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NonAuthGuard {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return of(true);
  }
}
