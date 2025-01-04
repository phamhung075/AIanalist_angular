import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../_core/rest/rest.service';
import { Profil } from './profile.interface';

@Injectable({
  providedIn: 'root',
})
export class ProfilService {
  constructor(private rest: RestService) {}

  getProfil(): Observable<Profil> {
    return this.rest.get<Profil>(`/users/me/profil`);
  }

  updateProfil(profil: Partial<Profil>): Observable<Profil> {
    return this.rest.put<Profil>(`/users/me/profil`, profil);
  }

  switchNotificationState(): Observable<boolean> {
    return this.rest.put<boolean>(`/users/me/email-notif`, {});
  }

  updatePassword(lastPassword: string, newPassword: string): Observable<void> {
    return this.rest.put<void>(`/users/me/password`, {
      lastPassword: lastPassword,
      newPassword: newPassword,
    });
  }
}
