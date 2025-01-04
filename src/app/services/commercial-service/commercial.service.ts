// commercial.service.ts mis à jour
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from './../_core/rest-service/rest.service';
import { Contact } from '../contact-service/contact.service';

export interface Commercial {
  id: string;
  contact_id: string;
  nombre_appels: number;
  historique_appel: Array<{
    date: string;
    status: 'pas_repondu' | 'pas_interesse' | 'a_rappeler' | 'rdv_pris';
    commentaire: string;
    date_rdv?: string;
    updated_by: string;
    updated_by_email: string;
  }>;
  created_by: string;
  created_at: string;
  updated_at: string;
  expanded?: boolean;
  contact?: Contact;
  last_call?: {
    date: string;
    status: 'pas_repondu' | 'pas_interesse' | 'a_rappeler' | 'rdv_pris';
    commentaire: string;
    date_rdv?: string;
    updated_by: string;
    updated_by_email?: string;
  } | null;
}

export interface CreateCommercialDto {
  contact_id: string;
}

export interface AddCallDto {
  commercialId: string;
  status: 'pas_repondu' | 'pas_interesse' | 'a_rappeler' | 'rdv_pris';
  commentaire: string;
  date_rdv?: string;
}

export interface UpdateCallCommentDto {
  commercialId: string;
  callIndex: number;
  newCommentaire: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommercialService {
  constructor(private rest: RestService) {}

  getCommerciaux(entrepriseType?: string | null): Observable<Commercial[]> {
    if (entrepriseType) {
      const params = new URLSearchParams();
      params.append('entrepriseType', entrepriseType);
      return this.rest.get<Commercial[]>(`/commercial?${params.toString()}`);
    }
    return this.rest.get<Commercial[]>('/commercial');
  }

  createCommercial(data: CreateCommercialDto): Observable<Commercial> {
    return this.rest.post<Commercial>('/commercial', data);
  }

  addCall(data: AddCallDto): Observable<Commercial> {
    return this.rest.put<Commercial>('/commercial', data);
  }

  updateCallComment(data: UpdateCallCommentDto): Observable<Commercial> {
    return this.rest.patch<Commercial>('/commercial', data);
  }
}