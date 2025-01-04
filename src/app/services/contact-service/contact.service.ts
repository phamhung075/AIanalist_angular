// contact.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from './../_core/rest-service/rest.service';
import { Entreprise } from '../entreprise-service/entreprise.service';

export interface Contact {
  id: string;
  entreprise_id: string;
  nom: string;
  prenom: string;
  email?: string;
  phone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  entreprise?: Entreprise;
  type?: string;
}

export interface CreateContactDto {
  entreprise_id: string;
  nom: string;
  prenom: string;
  email?: string;
  phone: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  constructor(private rest: RestService) {}

  getContacts(): Observable<Contact[]> {
    return this.rest.get<Contact[]>('/contacts');
  }

  createContact(data: CreateContactDto): Observable<Contact> {
    return this.rest.post<Contact>('/contacts', data);
  }

  updateContact(id: string, data: CreateContactDto): Observable<Contact> {
    return this.rest.patch<Contact>('/contacts', {id, data});
  }

  deleteContact(id: string): Observable<Contact> {
    return this.rest.delete<Contact>('/contacts', {id});
  }
}