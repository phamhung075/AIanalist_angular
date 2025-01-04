import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { User } from '../../models/user.model';
import { RestService } from '../_core/rest-service/rest.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private rest: RestService) { }

  getUsers(): Observable<User[]> {
    return this.rest.get<User[]>('/users/all').pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des Utilisateurs:', error);
        return throwError(() => error);
      })
    );
  }

  toggleStatus(userId: string): Observable<boolean> {
    return this.rest.post<boolean>('/users/toggle-active', {userId}).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return throwError(() => error);
      })
    );
  }

  toggleRole(userId: string): Observable<boolean> {
    return this.rest.post<boolean>('/users/toggle-role', {userId}).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour du role:', error);
        return throwError(() => error);
      })
    );
  }
}
