// entreprise.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from './../_core/rest-service/rest.service';

export interface Entreprise {
  id: string;
  denomination: string;
  siret?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  type?: string;
}

export interface CreateEntrepriseDto {
  denomination: string;
  siret?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntrepriseService {
  constructor(private rest: RestService) {}

  getEntreprises(params?: URLSearchParams): Observable<Entreprise[]> {
    const url = params ? `/entreprises?${params.toString()}` : '/entreprises';
    return this.rest.get<Entreprise[]>(url);
  }

  createEntreprise(data: CreateEntrepriseDto): Observable<Entreprise> {
    return this.rest.post<Entreprise>('/entreprises', data);
  }

  updateEntreprise(id: string, data: CreateEntrepriseDto): Observable<Entreprise> {
    return this.rest.patch<Entreprise>('/entreprises', {id, data});
  }

  deleteEntreprise(id: string): Observable<Entreprise> {
    return this.rest.delete<Entreprise>('/entreprises', {id});
  }
}
