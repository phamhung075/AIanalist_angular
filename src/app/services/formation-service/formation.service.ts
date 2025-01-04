import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../_core/rest-service/rest.service';
import { Formation } from '../../models/formation.model';



@Injectable({
  providedIn: 'root'
})
export class FormationService {
  constructor(private rest: RestService) {}

  getFormations(): Observable<Formation[]> {
    return this.rest.get<Formation[]>('/formations');
  }

  getFormationById(id: string): Observable<Formation> {
    return this.rest.get<Formation>(`/formations/${id}`);
  }

  createFormation(formation: Formation): Observable<Formation> {
    return this.rest.post<Formation>('/formations', formation);
  }

  updateFormation(id: string, formation: Partial<Formation>): Observable<Formation> {
    return this.rest.patch<Formation>(`/formations/${id}`, formation);
  }

  deleteFormation(id: string): Observable<void> {
    return this.rest.delete<void>(`/formations/${id}`);
  }
}